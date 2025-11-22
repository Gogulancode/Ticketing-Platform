using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPTraining.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoAssignmentFieldsToTicketGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AutoAssignmentEnabled",
                table: "TicketGroups",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MaxTicketsPerAgent",
                table: "TicketGroups",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoAssignmentEnabled",
                table: "TicketGroups");

            migrationBuilder.DropColumn(
                name: "MaxTicketsPerAgent",
                table: "TicketGroups");
        }
    }
}
