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

            var migrated = false;
            var attempts = 0;

            while (!migrated && attempts < 10)
            {
                try
                {
                    await context.Database.MigrateAsync();
                    migrated = true;
                }
                catch
                {
                    attempts++;
                    await Task.Delay(5000);
                }
            }

            if (!migrated)
            {
                throw new Exception("Database migration failed after 10 attempts.");
            }

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
                new Instrument { Symbol = "AMZN", Name = "Amazon.com Inc.", Type = "STOCK", CurrentPrice = 180m },
                new Instrument { Symbol = "META", Name = "Meta Platforms Inc.", Type = "STOCK", CurrentPrice = 500m },
                new Instrument { Symbol = "GOOGL", Name = "Alphabet Inc.", Type = "STOCK", CurrentPrice = 170m },
                new Instrument { Symbol = "NFLX", Name = "Netflix Inc.", Type = "STOCK", CurrentPrice = 620m },
                new Instrument { Symbol = "AMD", Name = "Advanced Micro Devices Inc.", Type = "STOCK", CurrentPrice = 165m },
                new Instrument { Symbol = "INTC", Name = "Intel Corporation", Type = "STOCK", CurrentPrice = 32m }
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