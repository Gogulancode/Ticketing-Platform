using Microsoft.AspNetCore.Mvc;

namespace ERPTraining.API.Controllers.Test;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet("hello")]
    public ActionResult<object> Hello()
    {
        return Ok(new { message = "Hello from backend!", timestamp = DateTime.UtcNow });
    }

    [HttpGet("categories")]
    public ActionResult<object> GetCategories()
    {
        var categories = new[]
        {
            new { id = 1, name = "Software", description = "Software issues" },
            new { id = 2, name = "Hardware", description = "Hardware issues" },
            new { id = 3, name = "Network", description = "Network problems" }
        };
        return Ok(categories);
    }
}