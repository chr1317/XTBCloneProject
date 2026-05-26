using System.Globalization;
using System.Text.Json;
using System.Xml.Linq;
using Backend.DTOs;
using StackExchange.Redis;

namespace Backend.Services
{
    public class EcbService
    {
        private const string CacheKey = "ecb:rates:pln-usd-eur";
        private const string EcbUrl = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

        private readonly HttpClient _httpClient;
        private readonly IDatabase _redisDatabase;

        public EcbService(HttpClient httpClient, IConnectionMultiplexer redis)
        {
            _httpClient = httpClient;
            _redisDatabase = redis.GetDatabase();
        }

        public async Task<List<CurrencyRateDto>> GetRatesAsync()
        {
            var cachedRates = await _redisDatabase.StringGetAsync(CacheKey);

            if (cachedRates.HasValue)
            {
                var ratesFromCache = JsonSerializer.Deserialize<List<CurrencyRateDto>>(cachedRates!);

                if (ratesFromCache != null)
                    return ratesFromCache;
            }

            var ratesFromEcb = await FetchRatesFromEcbAsync();

            var json = JsonSerializer.Serialize(ratesFromEcb);

            await _redisDatabase.StringSetAsync(
                CacheKey,
                json,
                expiry: TimeSpan.FromHours(12)
            );

            return ratesFromEcb;
        }

        public async Task<decimal> ConvertAsync(string fromCurrency, string toCurrency, decimal amount)
        {
            fromCurrency = fromCurrency.ToUpper();
            toCurrency = toCurrency.ToUpper();

            if (amount <= 0)
                throw new ArgumentException("Amount must be greater than 0.");

            if (fromCurrency == toCurrency)
                return amount;

            var rates = await GetRatesAsync();

            var fromRate = rates.FirstOrDefault(r => r.Currency == fromCurrency);
            var toRate = rates.FirstOrDefault(r => r.Currency == toCurrency);

            if (fromRate == null)
                throw new InvalidOperationException($"Currency {fromCurrency} is not supported.");

            if (toRate == null)
                throw new InvalidOperationException($"Currency {toCurrency} is not supported.");

            var amountInEur = amount / fromRate.RateToEur;
            var convertedAmount = amountInEur * toRate.RateToEur;

            return Math.Round(convertedAmount, 2);
        }

        public async Task<decimal> GetConversionRateAsync(string fromCurrency, string toCurrency)
        {
            var converted = await ConvertAsync(fromCurrency, toCurrency, 1m);
            return converted;
        }

        private async Task<List<CurrencyRateDto>> FetchRatesFromEcbAsync()
        {
            var xml = await _httpClient.GetStringAsync(EcbUrl);

            var document = XDocument.Parse(xml);

            XNamespace ns = "http://www.ecb.int/vocabulary/2002-08-01/eurofxref";

            var dateCube = document
                .Descendants(ns + "Cube")
                .FirstOrDefault(x => x.Attribute("time") != null);

            var rateDateText = dateCube?.Attribute("time")?.Value;

            var rateDate = !string.IsNullOrWhiteSpace(rateDateText)
                ? DateTime.Parse(rateDateText, CultureInfo.InvariantCulture)
                : DateTime.UtcNow.Date;

            var result = new List<CurrencyRateDto>
            {
                new CurrencyRateDto
                {
                    Currency = "EUR",
                    RateToEur = 1m,
                    RateDate = rateDate
                }
            };

            var wantedCurrencies = new[] { "USD", "PLN" };

            var currencyCubes = document
                .Descendants(ns + "Cube")
                .Where(x => x.Attribute("currency") != null);

            foreach (var currency in wantedCurrencies)
            {
                var cube = currencyCubes
                    .FirstOrDefault(x => x.Attribute("currency")?.Value == currency);

                if (cube == null)
                    continue;

                var rateText = cube.Attribute("rate")?.Value;

                if (string.IsNullOrWhiteSpace(rateText))
                    continue;

                var rate = decimal.Parse(
                    rateText,
                    NumberStyles.Any,
                    CultureInfo.InvariantCulture
                );

                result.Add(new CurrencyRateDto
                {
                    Currency = currency,
                    RateToEur = rate,
                    RateDate = rateDate
                });
            }

            return result;
        }
    }
}