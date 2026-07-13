using System.Data.Common;
using System.Globalization;

namespace EmbyInsights.Persistence;

public sealed class DatabaseMigrator(IDatabaseConnectionFactory connections)
{
    public async Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(cancellationToken).ConfigureAwait(false);
        await EnsureVersionTableAsync(connection, cancellationToken).ConfigureAwait(false);
        var current = await GetVersionAsync(connection, cancellationToken).ConfigureAwait(false);

        foreach (var migration in DatabaseMigrations.All.Where(x => x.Version > current).OrderBy(x => x.Version))
        {
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);
            await ExecuteAsync(connection, transaction, migration.Sql, cancellationToken).ConfigureAwait(false);
            await ExecuteAsync(connection, transaction,
                $"INSERT INTO SchemaVersion(Version, AppliedAt) VALUES ({migration.Version}, '{DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture)}');",
                cancellationToken).ConfigureAwait(false);
            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private static async Task EnsureVersionTableAsync(DbConnection connection, CancellationToken token) =>
        await ExecuteAsync(connection, null,
            "CREATE TABLE IF NOT EXISTS SchemaVersion (Version INTEGER NOT NULL PRIMARY KEY, AppliedAt TEXT NOT NULL);", token).ConfigureAwait(false);

    private static async Task<int> GetVersionAsync(DbConnection connection, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COALESCE(MAX(Version), 0) FROM SchemaVersion;";
        var result = await command.ExecuteScalarAsync(token).ConfigureAwait(false);
        return Convert.ToInt32(result, CultureInfo.InvariantCulture);
    }

    private static async Task ExecuteAsync(DbConnection connection, DbTransaction? transaction, string sql, CancellationToken token)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(token).ConfigureAwait(false);
    }
}
