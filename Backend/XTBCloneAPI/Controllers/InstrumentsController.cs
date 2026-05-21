using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/instruments")]
    public class InstrumentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InstrumentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var instruments = await _context.Instruments
                .OrderBy(i => i.Symbol)
                .ToListAsync();

            return Ok(instruments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var instrument = await _context.Instruments.FindAsync(id);

            if (instrument == null)
            {
                return NotFound("Instrument not found.");
            }

            return Ok(instrument);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create(CreateInstrumentDto request)
        {
            var exists = await _context.Instruments
                .AnyAsync(i => i.Symbol == request.Symbol);

            if (exists)
            {
                return BadRequest("Instrument with this symbol already exists.");
            }

            var instrument = new Instrument
            {
                Symbol = request.Symbol,
                Name = request.Name,
                Type = request.Type,
                CurrentPrice = request.CurrentPrice,
                IsActive = true,
                LastUpdatedAt = DateTime.UtcNow
            };

            _context.Instruments.Add(instrument);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = instrument.Id }, instrument);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateInstrumentDto request)
        {
            var instrument = await _context.Instruments.FindAsync(id);

            if (instrument == null)
            {
                return NotFound("Instrument not found.");
            }

            instrument.Symbol = request.Symbol;
            instrument.Name = request.Name;
            instrument.Type = request.Type;
            instrument.CurrentPrice = request.CurrentPrice;
            instrument.IsActive = request.IsActive;
            instrument.LastUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var instrument = await _context.Instruments.FindAsync(id);

            if (instrument == null)
            {
                return NotFound("Instrument not found.");
            }

            _context.Instruments.Remove(instrument);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}