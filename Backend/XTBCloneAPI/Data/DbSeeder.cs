using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var finnhubService = scope.ServiceProvider.GetRequiredService<FinnhubService>();

            await context.Database.MigrateAsync();

            if (await context.Instruments.AnyAsync())
            {
                return;
            }

            var instruments = new List<Instrument>
            {
                new Instrument { Symbol = "AAPL", Name = "Apple Inc.", Type = "STOCK", CurrentPrice = 190m },
                new Instrument { Symbol = "MSFT", Name = "Microsoft Corporation", Type = "STOCK", CurrentPrice = 420m },
                new Instrument { Symbol = "TSLA", Name = "Tesla Inc.", Type = "STOCK", CurrentPrice = 180m },
                new Instrument { Symbol = "NVDA", Name = "NVIDIA Corporation", Type = "STOCK", CurrentPrice = 900m },

                new Instrument { Symbol = "OANDA:EUR_USD", Name = "Euro / US Dollar", Type = "FOREX", CurrentPrice = 1.08m },
                new Instrument { Symbol = "OANDA:GBP_USD", Name = "British Pound / US Dollar", Type = "FOREX", CurrentPrice = 1.27m },
                new Instrument { Symbol = "OANDA:USD_JPY", Name = "US Dollar / Japanese Yen", Type = "FOREX", CurrentPrice = 150m },

                new Instrument { Symbol = "BINANCE:BTCUSDT", Name = "Bitcoin / USDT", Type = "CRYPTO", CurrentPrice = 65000m },
                new Instrument { Symbol = "BINANCE:ETHUSDT", Name = "Ethereum / USDT", Type = "CRYPTO", CurrentPrice = 3500m },
                new Instrument { Symbol = "BINANCE:SOLUSDT", Name = "Solana / USDT", Type = "CRYPTO", CurrentPrice = 150m }
            };

            foreach (var instrument in instruments)
            {
                var priceFromApi = await finnhubService.GetCurrentPriceAsync(instrument.Symbol);

                if (priceFromApi > 0)
                {
                    instrument.CurrentPrice = priceFromApi;
                }

                instrument.IsActive = true;
                instrument.LastUpdatedAt = DateTime.UtcNow;
            }

            context.Instruments.AddRange(instruments);
            await context.SaveChangesAsync();
        }
    }
}