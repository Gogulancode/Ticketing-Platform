using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPTraining.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedFlagToTicketStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.TicketStatuses', 'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.TicketStatuses
    ADD IsDeleted bit NOT NULL CONSTRAINT DF_TicketStatuses_IsDeleted DEFAULT(0);
END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.TicketStatuses', 'IsDeleted') IS NOT NULL
BEGIN
    DECLARE @constraintName sysname;
    SELECT @constraintName = dc.NAME
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c ON c.default_object_id = dc.object_id
    INNER JOIN sys.tables AS t ON t.object_id = c.object_id
    WHERE t.name = 'TicketStatuses' AND c.name = 'IsDeleted';

    IF @constraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE dbo.TicketStatuses DROP CONSTRAINT [' + @constraintName + ']');
    END;

    ALTER TABLE dbo.TicketStatuses DROP COLUMN IsDeleted;
END");
        }
    }
}
