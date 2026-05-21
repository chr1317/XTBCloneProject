using System.Security.Claims;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/trades")]
    [Authorize]
    public class TradesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TradesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTrade(CreateTradeDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            if (request.Quantity <= 0)
                return BadRequest("Quantity must be greater than 0.");

            var instrument = await _context.Instruments
                .FirstOrDefaultAsync(i => i.Id == request.InstrumentId && i.IsActive);

            if (instrument == null)
                return NotFound("Instrument not found.");

            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            var type = request.Type.ToUpper();
            var price = instrument.CurrentPrice;
            var totalValue = price * request.Quantity;

            if (type == "BUY")
            {
                if (wallet.CashBalance < totalValue)
                    return BadRequest("Insufficient funds.");

                wallet.CashBalance -= totalValue;

                var position = await _context.Positions
                    .FirstOrDefaultAsync(p =>
                        p.UserId == userId &&
                        p.InstrumentId == instrument.Id);

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
                    position.AverageBuyPrice = (oldValue + newValue) / newQuantity;
                }
            }
            else if (type == "SELL")
            {
                var position = await _context.Positions
                    .FirstOrDefaultAsync(p =>
                        p.UserId == userId &&
                        p.InstrumentId == instrument.Id);

                if (position == null || position.Quantity < request.Quantity)
                    return BadRequest("Not enough quantity to sell.");

                wallet.CashBalance += totalValue;
                position.Quantity -= request.Quantity;

                if (position.Quantity == 0)
                {
                    _context.Positions.Remove(position);
                }
            }
            else
            {
                return BadRequest("Trade type must be BUY or SELL.");
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
                    trade.CreatedAt
                },
                walletBalance = wallet.CashBalance
            });
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
    }
}