using System.Security.Claims;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/trades")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public class TradesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EcbService _ecbService;

        // Kolejność używania walut przy automatycznym przewalutowaniu.
        // Najpierw PLN, potem EUR.
        private static readonly string[] ConversionPriority = { "PLN", "EUR" };

        public TradesController(AppDbContext context, EcbService ecbService)
        {
            _context = context;
            _ecbService = ecbService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTrade(CreateTradeDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            if (request.Quantity <= 0)
            {
                return BadRequest(new
                {
                    code = "INVALID_QUANTITY",
                    message = "Quantity must be greater than 0."
                });
            }

            var type = request.Type.ToUpper();

            if (type != "BUY" && type != "SELL")
            {
                return BadRequest(new
                {
                    code = "INVALID_TRADE_TYPE",
                    message = "Trade type must be BUY or SELL."
                });
            }

            var instrument = await _context.Instruments
                .FirstOrDefaultAsync(i => i.Id == request.InstrumentId && i.IsActive);

            if (instrument == null)
            {
                return NotFound(new
                {
                    code = "INSTRUMENT_NOT_FOUND",
                    message = "Instrument not found."
                });
            }

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
            {
                return NotFound(new
                {
                    code = "WALLET_NOT_FOUND",
                    message = "Wallet not found."
                });
            }

            var usdBalance = wallet.Balances
                .FirstOrDefault(b => b.Currency.ToUpper() == "USD");

            if (usdBalance == null)
            {
                return BadRequest(new
                {
                    code = "USD_BALANCE_NOT_FOUND",
                    message = "USD balance not found."
                });
            }

            var price = instrument.CurrentPrice;
            var totalValue = Math.Round(price * request.Quantity, 2);

            try
            {
                List<ConversionPlanItemDto> conversionPlan = new();

                if (type == "BUY")
                {
                    if (usdBalance.Amount < totalValue)
                    {
                        var missingUsd = Math.Round(totalValue - usdBalance.Amount, 2);

                        conversionPlan = await BuildConversionPlanAsync(
                            wallet.Balances.ToList(),
                            missingUsd,
                            request.AcceptedConversionCurrency
                        );

                        if (!conversionPlan.Any())
                        {
                            return BadRequest(new
                            {
                                code = "INSUFFICIENT_FUNDS",
                                message = "Insufficient funds in USD and other supported currencies.",
                                trade = new
                                {
                                    instrument.Id,
                                    instrument.Symbol,
                                    instrument.Name,
                                    quantity = request.Quantity,
                                    price,
                                    totalValue
                                },
                                availableUsd = usdBalance.Amount,
                                missingUsd,
                                balances = wallet.Balances.Select(b => new
                                {
                                    b.Currency,
                                    b.Amount
                                })
                            });
                        }

                        // Pierwszy request: backend tylko zwraca plan przewalutowania.
                        if (!request.AllowAutoConversion)
                        {
                            return Conflict(new
                            {
                                code = "AUTO_CONVERSION_REQUIRED",
                                message = "Insufficient USD funds. Auto conversion is available.",
                                trade = new
                                {
                                    instrument.Id,
                                    instrument.Symbol,
                                    instrument.Name,
                                    quantity = request.Quantity,
                                    price,
                                    totalValue
                                },
                                availableUsd = usdBalance.Amount,
                                missingUsd,
                                conversionPlan
                            });
                        }

                        // Drugi request: użytkownik zaakceptował plan, więc wykonujemy przewalutowanie.
                        var conversionError = ApplyConversionPlan(
                            wallet.Balances.ToList(),
                            usdBalance,
                            conversionPlan
                        );

                        if (conversionError != null)
                        {
                            return BadRequest(new
                            {
                                code = "CONVERSION_FAILED",
                                message = conversionError
                            });
                        }
                    }

                    usdBalance.Amount = Math.Round(usdBalance.Amount - totalValue, 2);

                    var position = await _context.Positions
                        .FirstOrDefaultAsync(p =>
                            p.UserId == userId &&
                            p.InstrumentId == instrument.Id
                        );

                    if (position == null)
                    {
                        position = new Position
                        {
                            UserId = userId,
                            InstrumentId = instrument.Id,
                            Quantity = request.Quantity,
                            AverageBuyPrice = price
                        };

                        _context.Positions.Add(position);
                    }
                    else
                    {
                        var oldValue = position.Quantity * position.AverageBuyPrice;
                        var newValue = request.Quantity * price;
                        var newQuantity = position.Quantity + request.Quantity;

                        position.Quantity = newQuantity;
                        position.AverageBuyPrice = Math.Round((oldValue + newValue) / newQuantity, 2);
                    }
                }

                if (type == "SELL")
                {
                    var position = await _context.Positions
                        .FirstOrDefaultAsync(p =>
                            p.UserId == userId &&
                            p.InstrumentId == instrument.Id
                        );

                    if (position == null || position.Quantity < request.Quantity)
                    {
                        return BadRequest(new
                        {
                            code = "NOT_ENOUGH_QUANTITY",
                            message = "Not enough quantity to sell."
                        });
                    }

                    usdBalance.Amount = Math.Round(usdBalance.Amount + totalValue, 2);

                    position.Quantity -= request.Quantity;

                    if (position.Quantity == 0)
                    {
                        _context.Positions.Remove(position);
                    }
                }

                var trade = new Trade
                {
                    UserId = userId,
                    InstrumentId = instrument.Id,
                    Type = type,
                    Quantity = request.Quantity,
                    Price = price,
                    TotalValue = totalValue,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Trades.Add(trade);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Trade executed.",
                    trade = new
                    {
                        trade.Id,
                        trade.Type,
                        trade.Quantity,
                        trade.Price,
                        trade.TotalValue,
                        Currency = "USD",
                        trade.CreatedAt
                    },
                    autoConversionUsed = conversionPlan.Any(),
                    conversionPlan,
                    balances = wallet.Balances.Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("TRADE ERROR:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.StackTrace);

                if (ex.InnerException != null)
                {
                    Console.WriteLine("INNER:");
                    Console.WriteLine(ex.InnerException.Message);
                }

                return StatusCode(500, new
                {
                    code = "TRADE_EXECUTION_ERROR",
                    message = ex.Message,
                    innerMessage = ex.InnerException?.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTrades()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var trades = await _context.Trades
                .Include(t => t.Instrument)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Type,
                    t.Quantity,
                    t.Price,
                    t.TotalValue,
                    Currency = "USD",
                    t.CreatedAt,
                    Instrument = new
                    {
                        t.Instrument!.Id,
                        t.Instrument.Symbol,
                        t.Instrument.Name,
                        t.Instrument.Type
                    }
                })
                .ToListAsync();

            return Ok(trades);
        }

        private async Task<List<ConversionPlanItemDto>> BuildConversionPlanAsync(
            List<WalletBalance> balances,
            decimal missingUsd,
            string? acceptedCurrency)
        {
            missingUsd = Math.Round(missingUsd, 2);

            var supportedBalances = balances
                .Where(b => b.Currency.ToUpper() != "USD")
                .Where(b => ConversionPriority.Contains(b.Currency.ToUpper()))
                .Where(b => b.Amount > 0)
                .OrderBy(b => Array.IndexOf(ConversionPriority, b.Currency.ToUpper()))
                .ToList();

            if (!string.IsNullOrWhiteSpace(acceptedCurrency))
            {
                var accepted = acceptedCurrency.ToUpper();

                supportedBalances = supportedBalances
                    .Where(b => b.Currency.ToUpper() == accepted)
                    .ToList();
            }

            // 1. Najpierw szukamy jednej waluty, która sama pokryje cały brak.
            foreach (var balance in supportedBalances)
            {
                var proposal = await BuildSingleConversionItemAsync(balance, missingUsd);

                if (proposal != null)
                    return new List<ConversionPlanItemDto> { proposal };
            }

            // 2. Jeśli żadna pojedyncza waluta nie wystarcza, budujemy plan mieszany.
            var plan = new List<ConversionPlanItemDto>();
            var remainingUsd = missingUsd;

            foreach (var balance in supportedBalances)
            {
                if (remainingUsd <= 0)
                    break;

                var maxUsdFromThisCurrency = await _ecbService.ConvertAsync(
                    balance.Currency,
                    "USD",
                    balance.Amount
                );

                maxUsdFromThisCurrency = Math.Round(maxUsdFromThisCurrency, 2);

                if (maxUsdFromThisCurrency <= 0)
                    continue;

                var rate = maxUsdFromThisCurrency / balance.Amount;

                var usdToCover = Math.Min(remainingUsd, maxUsdFromThisCurrency);
                usdToCover = Math.Round(usdToCover, 2);

                var fromAmount = Math.Round(usdToCover / rate, 2);

                if (fromAmount > balance.Amount)
                    fromAmount = balance.Amount;

                var toAmount = Math.Round(fromAmount * rate, 2);

                plan.Add(new ConversionPlanItemDto
                {
                    FromCurrency = balance.Currency.ToUpper(),
                    ToCurrency = "USD",
                    FromAmount = fromAmount,
                    ToAmount = toAmount,
                    Rate = Math.Round(rate, 6)
                });

                remainingUsd = Math.Round(remainingUsd - toAmount, 2);
            }

            if (remainingUsd > 0.01m)
                return new List<ConversionPlanItemDto>();

            return plan;
        }

        private async Task<ConversionPlanItemDto?> BuildSingleConversionItemAsync(
            WalletBalance balance,
            decimal missingUsd)
        {
            var maxUsdFromBalance = await _ecbService.ConvertAsync(
                balance.Currency,
                "USD",
                balance.Amount
            );

            maxUsdFromBalance = Math.Round(maxUsdFromBalance, 2);

            if (maxUsdFromBalance < missingUsd)
                return null;

            var rate = maxUsdFromBalance / balance.Amount;
            var neededFromAmount = Math.Round(missingUsd / rate, 2);

            return new ConversionPlanItemDto
            {
                FromCurrency = balance.Currency.ToUpper(),
                ToCurrency = "USD",
                FromAmount = neededFromAmount,
                ToAmount = missingUsd,
                Rate = Math.Round(rate, 6)
            };
        }

        private static string? ApplyConversionPlan(
            List<WalletBalance> balances,
            WalletBalance usdBalance,
            List<ConversionPlanItemDto> conversionPlan)
        {
            foreach (var item in conversionPlan)
            {
                var fromBalance = balances.FirstOrDefault(b =>
                    b.Currency.ToUpper() == item.FromCurrency.ToUpper());

                if (fromBalance == null)
                    return $"Balance {item.FromCurrency} not found.";

                if (fromBalance.Amount < item.FromAmount)
                    return $"Insufficient {item.FromCurrency} balance. Required: {item.FromAmount}, available: {fromBalance.Amount}.";

                fromBalance.Amount = Math.Round(fromBalance.Amount - item.FromAmount, 2);
                usdBalance.Amount = Math.Round(usdBalance.Amount + item.ToAmount, 2);
            }

            return null;
        }

        private class ConversionPlanItemDto
        {
            public string FromCurrency { get; set; } = string.Empty;
            public string ToCurrency { get; set; } = "USD";
            public decimal FromAmount { get; set; }
            public decimal ToAmount { get; set; }
            public decimal Rate { get; set; }
        }
    }
}
