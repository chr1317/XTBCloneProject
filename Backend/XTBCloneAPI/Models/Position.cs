using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class Position
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public int InstrumentId { get; set; }
        public Instrument? Instrument { get; set; }

        public decimal Quantity { get; set; }

        public decimal AverageBuyPrice { get; set; }
    }
}