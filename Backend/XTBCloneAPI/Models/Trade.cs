using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class Trade
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public int InstrumentId { get; set; }
        public Instrument? Instrument { get; set; }

        public string Type { get; set; } = string.Empty;
        // BUY albo SELL

        public decimal Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal TotalValue { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}