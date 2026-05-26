using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/currencies")]
    public class CurrenciesController : ControllerBase
    {
        private readonly EcbService _ecbService;

        public CurrenciesController(EcbService ecbService)
        {
            _ecbService = ecbService;
        }

        [HttpGet("rates")]
        public async Task<IActionResult> GetRates()
        {
            var rates = await _ecbService.GetRatesAsync();

            return Ok(rates);
        }
    }
}