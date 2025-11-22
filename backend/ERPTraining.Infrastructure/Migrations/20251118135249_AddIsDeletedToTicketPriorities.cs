using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPTraining.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToTicketPriorities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "TicketPriorities",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "TicketPriorities");
        }
    }
}
