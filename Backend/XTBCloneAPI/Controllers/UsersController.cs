using System.Security.Claims;
using Backend.Data;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var user = await _context.Users
                .Include(u => u.Wallet!)
                    .ThenInclude(w => w.Balances)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                user.AvatarPath,
                Balances = user.Wallet?.Balances
                    .OrderBy(b => b.Currency)
                    .Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe(UpdateUserDto request)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound();

            var emailTaken = await _context.Users.AnyAsync(u =>
                u.Email == request.Email &&
                u.Id != userId
            );

            if (emailTaken)
                return BadRequest("Email already taken.");

            user.Username = request.Username;
            user.Email = request.Email;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User updated.",
                user.Id,
                user.Username,
                user.Email
            });
        }

        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMe()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _context.Users
                .Include(u => u.Wallet!)
                    .ThenInclude(w => w.Balances)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                user.AvatarPath,
                Balances = user.Wallet?.Balances
                    .OrderBy(b => b.Currency)
                    .Select(b => new
                    {
                        b.Currency,
                        b.Amount
                    })
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}