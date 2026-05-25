using System.Security.Claims;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/files")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public FilesController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            if (file == null || file.Length == 0)
                return BadRequest("File is required.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                return BadRequest("Only JPG, PNG and WEBP files are allowed.");

            if (file.Length > 2 * 1024 * 1024)
                return BadRequest("File size cannot exceed 2 MB.");

            var userId = int.Parse(userIdText);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found.");

            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadsPath = Path.Combine(webRootPath, "uploads", "avatars");

            Directory.CreateDirectory(uploadsPath);

            var fileName = $"user_{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            user.AvatarPath = $"/uploads/avatars/{fileName}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Avatar uploaded.",
                avatarPath = user.AvatarPath,
                avatarUrl = $"{Request.Scheme}://{Request.Host}{user.AvatarPath}"
            });
        }
        [HttpGet("avatar")]
        public async Task<IActionResult> GetMyAvatar()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userIdText == null)
                return Unauthorized();

            var userId = int.Parse(userIdText);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found.");

            return Ok(new
            {
                user.AvatarPath,
                AvatarUrl = user.AvatarPath != null
                    ? $"{Request.Scheme}://{Request.Host}{user.AvatarPath}"
                    : null
            });
        }
    }
}