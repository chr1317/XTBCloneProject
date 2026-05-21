using System.Security.Claims;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/positions")]
    [Authorize]
    public class PositionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PositionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyPositions()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var positions = await _context.Positions
                .Include(p => p.Instrument)
                .Where(p => p.UserId == userId)
                .Select(p => new
                {
                    p.Id,
                    p.Quantity,
                    p.AverageBuyPrice,
                    CurrentPrice = p.Instrument!.CurrentPrice,
                    CurrentValue = p.Quantity * p.Instrument.CurrentPrice,
                    ProfitLoss = (p.Instrument.CurrentPrice - p.AverageBuyPrice) * p.Quantity,
                    Instrument = new
                    {
                        p.Instrument.Id,
                        p.Instrument.Symbol,
                        p.Instrument.Name,
                        p.Instrument.Type
                    }
                })
                .ToListAsync();

            return Ok(positions);
        }
    }
}