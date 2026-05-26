namespace Backend.DTOs
{
    public class WithdrawDepositDto
    {
        public string Currency { get; set; } = "USD";

        public decimal Amount { get; set; }
    }
}