using System.Security.Claims;
using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Services;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/wallet")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EcbService _ecbService;

        public WalletController(
            AppDbContext context,
            EcbService ecbService)
        {
            _context = context;
            _ecbService = ecbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWallet()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            return Ok(new
            {
                wallet.Id,
                balances = wallet.Balances
                    .OrderBy(b => b.Currency)
                    .Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
            });
        }

        [HttpGet("total")]
public async Task<IActionResult> GetWalletTotal([FromQuery] string currency)
{
    var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

    if (userIdText == null)
        return Unauthorized();

    if (string.IsNullOrWhiteSpace(currency))
    {
        return BadRequest(new
        {
            code = "CURRENCY_REQUIRED",
            message = "Currency is required."
        });
    }

    var targetCurrency = currency.ToUpper();

    if (!IsSupportedCurrency(targetCurrency))
    {
        return BadRequest(new
        {
            code = "UNSUPPORTED_CURRENCY",
            message = "Supported currencies are: USD, EUR, PLN."
        });
    }

    var userId = int.Parse(userIdText);

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

    var convertedBalances = new List<object>();
    decimal totalAmount = 0;

    foreach (var balance in wallet.Balances.OrderBy(b => b.Currency))
    {
        var sourceCurrency = balance.Currency.ToUpper();

        if (!IsSupportedCurrency(sourceCurrency))
            continue;

        decimal convertedAmount;
        decimal rate;

        if (sourceCurrency == targetCurrency)
        {
            convertedAmount = balance.Amount;
            rate = 1m;
        }
        else
        {
            convertedAmount = await _ecbService.ConvertAsync(
                sourceCurrency,
                targetCurrency,
                balance.Amount
            );

            rate = await _ecbService.GetConversionRateAsync(
                sourceCurrency,
                targetCurrency
            );
        }

        convertedAmount = Math.Round(convertedAmount, 2);
        totalAmount += convertedAmount;
    
        convertedBalances.Add(new
        {
            currency = sourceCurrency,
            amount = Math.Round(balance.Amount, 2),
            convertedAmount,
            rate = Math.Round(rate, 6)
        });
    }

    return Ok(new
    {
        currency = targetCurrency,
        totalAmount = Math.Round(totalAmount, 2),
        balances = convertedBalances
    });
}

        [HttpPost("deposit")]
        public async Task<IActionResult> Deposit(WithdrawDepositDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            if (request.Amount <= 0)
                return BadRequest("Amount must be greater than 0.");

            var currency = request.Currency.ToUpper();

            if (!IsSupportedCurrency(currency))
                return BadRequest("Supported currencies are: USD, EUR, PLN.");

            var userId = int.Parse(userIdText);

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            var balance = wallet.Balances
                .FirstOrDefault(b => b.Currency == currency);

            if (balance == null)
            {
                balance = new Models.WalletBalance
                {
                    WalletId = wallet.Id,
                    Currency = currency,
                    Amount = 0
                };

                wallet.Balances.Add(balance);
            }

            balance.Amount += request.Amount;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Deposit successful.",
                wallet.Id,
                depositedCurrency = currency,
                depositedAmount = request.Amount,
                balances = wallet.Balances
                    .OrderBy(b => b.Currency)
                    .Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
            });
        }
        [HttpPost("withdraw")]
        public async Task<IActionResult> Withdraw(WithdrawDepositDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            if (request.Amount <= 0)
                return BadRequest("Amount must be greater than 0.");

            var currency = request.Currency.ToUpper();

            if (!IsSupportedCurrency(currency))
                return BadRequest("Supported currencies are: USD, EUR, PLN.");

            var userId = int.Parse(userIdText);

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            var balance = wallet.Balances
                .FirstOrDefault(b => b.Currency == currency);

            if (balance == null)
            {
                return BadRequest($"{currency} balance not found.");
            }

            balance.Amount -= request.Amount;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Withdrawal successful.",
                wallet.Id,
                withdrawnCurrency = currency,
                withdrawnAmount = request.Amount,
                balances = wallet.Balances
                    .OrderBy(b => b.Currency)
                    .Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
            });
        }


        [HttpPost("convert")]
        public async Task<IActionResult> ConvertCurrency(ConvertCurrencyDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            if (request.Amount <= 0)
                return BadRequest("Amount must be greater than 0.");

            var fromCurrency = request.FromCurrency.ToUpper();
            var toCurrency = request.ToCurrency.ToUpper();

            if (fromCurrency == toCurrency)
                return BadRequest("Currencies must be different.");

            if (!IsSupportedCurrency(fromCurrency) ||
                !IsSupportedCurrency(toCurrency))
            {
                return BadRequest("Supported currencies are: USD, EUR, PLN.");
            }

            var userId = int.Parse(userIdText);

            var wallet = await _context.Wallets
                .Include(w => w.Balances)
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            var fromBalance = wallet.Balances
                .FirstOrDefault(b => b.Currency == fromCurrency);

            if (fromBalance == null)
                return BadRequest($"{fromCurrency} balance not found.");

            if (fromBalance.Amount < request.Amount)
                return BadRequest($"Insufficient {fromCurrency} funds.");

            var toBalance = wallet.Balances
                .FirstOrDefault(b => b.Currency == toCurrency);

            if (toBalance == null)
            {
                toBalance = new WalletBalance
                {
                    WalletId = wallet.Id,
                    Currency = toCurrency,
                    Amount = 0
                };

                wallet.Balances.Add(toBalance);
            }

            var convertedAmount = await _ecbService.ConvertAsync(
                fromCurrency,
                toCurrency,
                request.Amount
            );

            var rate = await _ecbService.GetConversionRateAsync(
                fromCurrency,
                toCurrency
            );

            fromBalance.Amount -= request.Amount;
            toBalance.Amount += convertedAmount;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Currency converted successfully.",
                conversion = new
                {
                    fromCurrency,
                    toCurrency,
                    fromAmount = request.Amount,
                    convertedAmount,
                    rate
                },
                balances = wallet.Balances
                    .OrderBy(b => b.Currency)
                    .Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
            });
        }

        private static bool IsSupportedCurrency(string currency)
        {
            return currency == "USD" || currency == "EUR" || currency == "PLN";
        }
    }
}