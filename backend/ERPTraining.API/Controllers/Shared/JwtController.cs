using Microsoft.AspNetCore.Mvc;
using ERPTraining.API.Services;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JwtController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public JwtController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("generate")]
        public IActionResult GenerateToken([FromBody] GenerateTokenRequest request)
        {
            try
            {
                string secretKey = request.SecretKey ?? _configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
                string issuer = request.Issuer ?? _configuration["Jwt:Issuer"] ?? "ERPTrainingAPI";
                string audience = request.Audience ?? _configuration["Jwt:Audience"] ?? "ERPTrainingClient";
                int expirationMinutes = request.ExpirationMinutes ?? 60;

                string token;

                if (request.CustomClaims != null && request.CustomClaims.Any())
                {
                    token = JwtTokenService.GenerateTokenWithCustomClaims(
                        secretKey, 
                        request.CustomClaims, 
                        issuer, 
                        audience, 
                        expirationMinutes
                    );
                }
                else
                {
                    token = JwtTokenService.GenerateToken(
                        secretKey, 
                        issuer, 
                        audience, 
                        expirationMinutes
                    );
                }

                return Ok(new
                {
                    token = token,
                    expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes),
                    bearerFormat = $"Bearer {token}"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("validate")]
        public IActionResult ValidateToken([FromBody] ValidateTokenRequest request)
        {
            try
            {
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var token = handler.ReadJwtToken(request.Token);

                return Ok(new
                {
                    isValid = true,
                    claims = token.Claims.Select(c => new { c.Type, c.Value }),
                    expiresAt = token.ValidTo,
                    isExpired = token.ValidTo < DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { isValid = false, error = ex.Message });
            }
        }
    }

    public class GenerateTokenRequest
    {
        public string? SecretKey { get; set; }
        public string? Issuer { get; set; }
        public string? Audience { get; set; }
        public int? ExpirationMinutes { get; set; }
        public Dictionary<string, string>? CustomClaims { get; set; }
    }

    public class ValidateTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
