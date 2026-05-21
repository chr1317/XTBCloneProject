using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using System.Text.Json;

namespace Backend.Services
{
    public class FinnhubService
    {
        private readonly HttpClient _httpClient;

        public FinnhubService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<decimal> GetCurrentPriceAsync(string symbol)
        {
            var apiKey = Environment.GetEnvironmentVariable("FINNHUB_API_KEY");

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return 0;
            }

            var url = $"https://finnhub.io/api/v1/quote?symbol={Uri.EscapeDataString(symbol)}&token={apiKey}";

            try
            {
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return 0;
                }

                var json = await response.Content.ReadAsStringAsync();

                using var document = JsonDocument.Parse(json);

                if (!document.RootElement.TryGetProperty("c", out var currentPriceElement))
                {
                    return 0;
                }

                var currentPrice = currentPriceElement.GetDecimal();

                return currentPrice;
            }
            catch
            {
                return 0;
            }
        }
    }
}