using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.DTOs
{
    public class CreateTradeDto
    {
        public int InstrumentId { get; set; }

        public string Type { get; set; } = string.Empty;
        // BUY albo SELL

        public decimal Quantity { get; set; }
    }
}