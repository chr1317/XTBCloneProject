using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class Instrument
    {
        public int Id { get; set; }

        public string Symbol { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public decimal CurrentPrice { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

        public List<Trade> Trades { get; set; } = new();

        public List<Position> Positions { get; set; } = new();
    }
}