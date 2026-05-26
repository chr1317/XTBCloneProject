using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Instrument> Instruments { get; set; }
        public DbSet<Trade> Trades { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<WalletBalance> WalletBalances { get; set; }
        public DbSet<CurrencyRate> CurrencyRates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasOne(u => u.Wallet)
                .WithOne(w => w.User)
                .HasForeignKey<Wallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Trades)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Positions)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Instrument>()
                .HasMany(i => i.Trades)
                .WithOne(t => t.Instrument)
                .HasForeignKey(t => t.InstrumentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Instrument>()
                .HasMany(i => i.Positions)
                .WithOne(p => p.Instrument)
                .HasForeignKey(p => p.InstrumentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Instrument>()
                .HasIndex(i => i.Symbol)
                .IsUnique();
                
            modelBuilder.Entity<Wallet>()
                .HasMany(w => w.Balances)
                .WithOne(b => b.Wallet)
                .HasForeignKey(b => b.WalletId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WalletBalance>()
                .HasIndex(b => new { b.WalletId, b.Currency })
                .IsUnique();

            modelBuilder.Entity<CurrencyRate>()
                .HasIndex(r => r.Currency)
                .IsUnique();
        }
    }
}