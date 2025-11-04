namespace ERPTraining.Core.Entities.Tickets;

public class TicketConfiguration
{
    public int Id { get; set; }
    public int AutoCloseDays { get; set; } = 7;
    public bool EnableSla { get; set; } = true;
}
