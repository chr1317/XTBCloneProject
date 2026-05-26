using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;

        public AuthController(AppDbContext context, TokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            var emailExists = await _context.Users.AnyAsync(u => u.Email == request.Email);

            if (emailExists)
            {
                return BadRequest("User with this email already exists.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = "User",
                Wallet = new Wallet
                {
                    Balances = new List<WalletBalance>
                    {
                        new WalletBalance { Currency = "USD", Amount = 10000m },
                        new WalletBalance { Currency = "EUR", Amount = 0m },
                        new WalletBalance { Currency = "PLN", Amount = 0m }
                    }
                }
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Created("api/users/" + user.Id, new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                WalletBalance = user.Wallet.Balances
            });
        }

        [EnableRateLimiting("LoginPolicy")]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (!validPassword)
            {
                return Unauthorized("Invalid email or password.");
            }

            var token = _tokenService.CreateToken(user);

            return Ok(new
            {
                message = "Login successful.",
                token,
                user = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.Role
                }
            });
        }
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.Wallet)
                .FirstOrDefaultAsync(u => u.Id == int.Parse(userId));

            if (user == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Role,
                WalletBalance = user.Wallet != null ? user.Wallet.Balances : new List<WalletBalance>()
            });
        }
    }
}