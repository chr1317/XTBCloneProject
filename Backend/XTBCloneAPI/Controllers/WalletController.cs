using System.Security.Claims;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.DTOs;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/wallet")]
    [Authorize]
    public class WalletController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WalletController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWallet()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            return Ok(new
            {
                wallet.Id,
                wallet.CashBalance
            });
        }
        [HttpPost("deposit")]
        public async Task<IActionResult> Deposit(DepositDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            if (request.Amount <= 0)
                return BadRequest("Amount must be greater than 0.");

            var userId = int.Parse(userIdText);

            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
                return NotFound("Wallet not found.");

            wallet.CashBalance += request.Amount;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Deposit successful.",
                wallet.Id,
                wallet.CashBalance
            });
        }
    }
}