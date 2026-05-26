namespace Backend.DTOs
{
    public class CreateTradeDto
    {
        public int InstrumentId { get; set; }

        public string Type { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public bool AllowAutoConversion { get; set; } = false;
    }
}