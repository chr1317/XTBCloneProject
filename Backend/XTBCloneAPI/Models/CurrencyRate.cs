using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class CurrencyRate
    {
        public int Id { get; set; }

        public string Currency { get; set; } = string.Empty;
        // EUR, USD, PLN

        public decimal RateToEur { get; set; }
        // 1 EUR = X Currency
        // EUR = 1
        // USD np. 1.08
        // PLN np. 4.30

        public DateTime RateDate { get; set; }

        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
    }
}