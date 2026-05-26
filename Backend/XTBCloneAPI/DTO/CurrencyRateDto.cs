namespace Backend.DTOs
{
    public class CurrencyRateDto
    {
        public string Currency { get; set; } = string.Empty;

        public decimal RateToEur { get; set; }

        public DateTime RateDate { get; set; }
    }
}