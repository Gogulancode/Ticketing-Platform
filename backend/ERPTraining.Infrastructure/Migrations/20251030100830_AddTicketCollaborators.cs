using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPTraining.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketCollaborators : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RoleModuleSections_Role_RoleId",
                table: "RoleModuleSections");

            migrationBuilder.DropForeignKey(
                name: "FK_SlaEscalationContacts_SlaPolicies_SlaPolicyId",
                table: "SlaEscalationContacts");

            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_SlaPolicies_SlaPolicyId",
                table: "Tickets");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Role_RoleId",
                table: "UserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Role_RoleId1",
                table: "UserRoles");

            migrationBuilder.DropTable(
                name: "SlaPolicies");

            migrationBuilder.DropIndex(
                name: "IX_SLAs_Category_Priority",
                table: "SLAs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Role",
                table: "Role");

            migrationBuilder.RenameTable(
                name: "Role",
                newName: "Roles");

            migrationBuilder.RenameColumn(
                name: "ResolutionMinutes",
                table: "SLAs",
                newName: "ResolutionMins");

            migrationBuilder.RenameColumn(
                name: "FirstResponseMinutes",
                table: "SLAs",
                newName: "FirstResponseMins");

            migrationBuilder.AlterColumn<Guid>(
                name: "SlaPolicyId",
                table: "Tickets",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "SLAs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "SLAs",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SLAs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "SLAs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "SLAs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "SLAs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<Guid>(
                name: "SlaPolicyId",
                table: "SlaEscalationContacts",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Roles",
                table: "Roles",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "TicketCollaborators",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AddedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketCollaborators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketCollaborators_AspNetUsers_AddedByUserId",
                        column: x => x.AddedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketCollaborators_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketCollaborators_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketCollaborators_AddedByUserId",
                table: "TicketCollaborators",
                column: "AddedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketCollaborators_TicketId_UserId",
                table: "TicketCollaborators",
                columns: new[] { "TicketId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TicketCollaborators_UserId",
                table: "TicketCollaborators",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleModuleSections_Roles_RoleId",
                table: "RoleModuleSections",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SlaEscalationContacts_SLAs_SlaPolicyId",
                table: "SlaEscalationContacts",
                column: "SlaPolicyId",
                principalTable: "SLAs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_SLAs_SlaPolicyId",
                table: "Tickets",
                column: "SlaPolicyId",
                principalTable: "SLAs",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_RoleMasters_RoleId",
                table: "UserRoles",
                column: "RoleId",
                principalTable: "RoleMasters",
                principalColumn: "RoleId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Roles_RoleId1",
                table: "UserRoles",
                column: "RoleId1",
                principalTable: "Roles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RoleModuleSections_Roles_RoleId",
                table: "RoleModuleSections");

            migrationBuilder.DropForeignKey(
                name: "FK_SlaEscalationContacts_SLAs_SlaPolicyId",
                table: "SlaEscalationContacts");

            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_SLAs_SlaPolicyId",
                table: "Tickets");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_RoleMasters_RoleId",
                table: "UserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Roles_RoleId1",
                table: "UserRoles");

            migrationBuilder.DropTable(
                name: "TicketCollaborators");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Roles",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SLAs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "SLAs");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "SLAs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "SLAs");

            migrationBuilder.RenameTable(
                name: "Roles",
                newName: "Role");

            migrationBuilder.RenameColumn(
                name: "ResolutionMins",
                table: "SLAs",
                newName: "ResolutionMinutes");

            migrationBuilder.RenameColumn(
                name: "FirstResponseMins",
                table: "SLAs",
                newName: "FirstResponseMinutes");

            migrationBuilder.AlterColumn<int>(
                name: "SlaPolicyId",
                table: "Tickets",
                type: "int",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "SLAs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "SLAs",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "SlaPolicyId",
                table: "SlaEscalationContacts",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Role",
                table: "Role",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "SlaPolicies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PriorityId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EscalationLevel1Minutes = table.Column<int>(type: "int", nullable: true),
                    EscalationLevel2Minutes = table.Column<int>(type: "int", nullable: true),
                    EscalationLevel3Minutes = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ResolutionTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    ResponseTimeMinutes = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaPolicies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlaPolicies_TicketPriorities_PriorityId",
                        column: x => x.PriorityId,
                        principalTable: "TicketPriorities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SLAs_Category_Priority",
                table: "SLAs",
                columns: new[] { "Category", "Priority" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SlaPolicies_PriorityId",
                table: "SlaPolicies",
                column: "PriorityId");

            migrationBuilder.AddForeignKey(
                name: "FK_RoleModuleSections_Role_RoleId",
                table: "RoleModuleSections",
                column: "RoleId",
                principalTable: "Role",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SlaEscalationContacts_SlaPolicies_SlaPolicyId",
                table: "SlaEscalationContacts",
                column: "SlaPolicyId",
                principalTable: "SlaPolicies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_SlaPolicies_SlaPolicyId",
                table: "Tickets",
                column: "SlaPolicyId",
                principalTable: "SlaPolicies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Role_RoleId",
                table: "UserRoles",
                column: "RoleId",
                principalTable: "Role",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Role_RoleId1",
                table: "UserRoles",
                column: "RoleId1",
                principalTable: "Role",
                principalColumn: "Id");
        }
    }
}
