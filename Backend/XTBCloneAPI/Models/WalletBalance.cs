namespace Backend.Models
{
    public class WalletBalance
    {
        public int Id { get; set; }

        public int WalletId { get; set; }
        public Wallet? Wallet { get; set; }

        public string Currency { get; set; } = string.Empty;

        public decimal Amount { get; set; }
    }
}