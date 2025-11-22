using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPTraining.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToCustomFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "CustomFields",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("UPDATE CustomFields SET IsDeleted = 1 WHERE IsActive = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "CustomFields");
        }
    }
}
