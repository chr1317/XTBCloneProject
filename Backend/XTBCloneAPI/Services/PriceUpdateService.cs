using Backend.Data;
using Backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class PriceUpdateService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHubContext<PricesHub> _hubContext;
        private readonly FinnhubService _finnhubService;
        private readonly Random _random = new();

        private DateTime _lastFinnhubUpdate = DateTime.MinValue;

        public PriceUpdateService(
            IServiceProvider serviceProvider,
            IHubContext<PricesHub> hubContext,
            FinnhubService finnhubService)
        {
            _serviceProvider = serviceProvider;
            _hubContext = hubContext;
            _finnhubService = finnhubService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var instruments = await context.Instruments
                    .Where(i => i.IsActive)
                    .ToListAsync(stoppingToken);

                var shouldCallFinnhub =
                    DateTime.UtcNow - _lastFinnhubUpdate > TimeSpan.FromSeconds(70);

                foreach (var instrument in instruments)
                {
                    if (shouldCallFinnhub)
                    {
                        var apiPrice = await _finnhubService.GetCurrentPriceAsync(instrument.Symbol);

                        if (apiPrice > 0)
                        {
                            instrument.CurrentPrice = apiPrice;
                        }
                    }
                    else
                    {
                        var changePercent = ((decimal)_random.NextDouble() - 0.5m) / 100m;
                        instrument.CurrentPrice += instrument.CurrentPrice * changePercent;

                        if (instrument.CurrentPrice < 0)
                            instrument.CurrentPrice = 0;
                    }

                    instrument.LastUpdatedAt = DateTime.UtcNow;
                }

                if (shouldCallFinnhub)
                {
                    _lastFinnhubUpdate = DateTime.UtcNow;
                }

                await context.SaveChangesAsync(stoppingToken);

                var prices = instruments.Select(i => new
                {
                    i.Id,
                    i.Symbol,
                    i.Name,
                    i.Type,
                    i.CurrentPrice,
                    i.LastUpdatedAt
                });

                await _hubContext.Clients.All.SendAsync("ReceivePrices", prices, stoppingToken);

                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }
}