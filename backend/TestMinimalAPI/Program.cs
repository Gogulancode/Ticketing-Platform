var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "Hello from .NET 8!");
app.MapGet("/test", () => "API is working!");
app.Run();
