namespace Backend.DTOs
{
    public class DepositDto
    {
        public string Currency { get; set; } = "USD";

        public decimal Amount { get; set; }
    }
}