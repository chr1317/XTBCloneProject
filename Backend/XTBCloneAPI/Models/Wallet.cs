using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class Wallet
    {
         public int Id { get; set; }

        public decimal  CashBalance { get; set; } = 10000m;

        public int UserId { get; set; }

        public User? User { get; set; }
    }
}