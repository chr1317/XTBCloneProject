using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class Wallet
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public List<WalletBalance> Balances { get; set; } = new();
    }
}