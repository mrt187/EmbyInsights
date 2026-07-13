using System.Data.Common;
using System.Globalization;
using EmbyInsights.Models;

namespace EmbyInsights.Persistence;

public sealed class SqlitePlaybackRepository(
    IDatabaseConnectionFactory connections,
    DatabaseMigrator migrator) : IPlaybackRepository
{
    public Task InitializeAsync(CancellationToken cancellationToken = default) =>
        migrator.MigrateAsync(cancellationToken);

    public async Task AddAsync(PlaybackRecord record, CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO PlaybackRecords
            (Id, SessionId, UserId, ItemId, ItemName, MediaKind, StartedAt, EndedAt,
             WatchedTicks, PlaybackMethod, ClientName, DeviceName, SourceId, SourceRecordId)
            VALUES
            (@id, @session, @user, @item, @name, @kind, @started, @ended,
             @ticks, @method, @client, @device, @source, @sourceRecord);
            """;
        Add(command, "@id", record.Id.ToString("D")); Add(command, "@session", record.SessionId);
        Add(command, "@user", record.UserId); Add(command, "@item", record.ItemId);
        Add(command, "@name", record.ItemName); Add(command, "@kind", (int)record.MediaKind);
        Add(command, "@started", record.StartedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        Add(command, "@ended", record.EndedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        Add(command, "@ticks", record.WatchedTicks); Add(command, "@method", (int)record.PlaybackMethod);
        Add(command, "@client", record.ClientName); Add(command, "@device", record.DeviceName);
        Add(command, "@source", record.SourceId); Add(command, "@sourceRecord", record.SourceRecordId);
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> ContainsAsync(PlaybackIdentity identity, CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT EXISTS(SELECT 1 FROM PlaybackRecords WHERE SourceId=@source AND SourceRecordId=@record);";
        Add(command, "@source", identity.SourceId); Add(command, "@record", identity.SourceRecordId);
        return Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false), CultureInfo.InvariantCulture) == 1;
    }

    public async Task<IReadOnlyList<PlaybackRecord>> QueryAsync(StatisticsQuery query, CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, SessionId, UserId, ItemId, ItemName, MediaKind, StartedAt, EndedAt,
                   WatchedTicks, PlaybackMethod, ClientName, DeviceName, SourceId, SourceRecordId
            FROM PlaybackRecords
            WHERE StartedAt >= @from AND StartedAt < @to
              AND (@user IS NULL OR UserId = @user)
            ORDER BY StartedAt;
            """;
        Add(command, "@from", query.From.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        Add(command, "@to", query.To.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        Add(command, "@user", query.UserId);
        var rows = new List<PlaybackRecord>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            rows.Add(Read(reader));
        return rows;
    }

    public async Task DeleteBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM PlaybackRecords WHERE EndedAt < @cutoff;";
        Add(command, "@cutoff", cutoff.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
    }

    private static PlaybackRecord Read(DbDataReader reader) => new(
        Guid.Parse(reader.GetString(0)), reader.GetString(1), reader.GetString(2), reader.GetString(3),
        reader.GetString(4), (MediaKind)reader.GetInt32(5), DateTimeOffset.Parse(reader.GetString(6), CultureInfo.InvariantCulture),
        DateTimeOffset.Parse(reader.GetString(7), CultureInfo.InvariantCulture), reader.GetInt64(8),
        (PlaybackMethod)reader.GetInt32(9), GetNullable(reader, 10), GetNullable(reader, 11),
        reader.GetString(12), GetNullable(reader, 13));

    private static string? GetNullable(DbDataReader reader, int ordinal) => reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);

    private static void Add(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter(); parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value; command.Parameters.Add(parameter);
    }
}
