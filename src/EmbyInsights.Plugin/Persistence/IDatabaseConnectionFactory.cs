using System.Data.Common;

namespace EmbyInsights.Persistence;

public interface IDatabaseConnectionFactory
{
    Task<DbConnection> OpenAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// TODO(SQLite provider): implement using the SQLite provider confirmed compatible
/// with the selected Emby runtime (for example an Emby-bundled provider).
/// </summary>
public sealed class EmbySqliteConnectionFactory : IDatabaseConnectionFactory
{
    public Task<DbConnection> OpenAsync(CancellationToken cancellationToken = default) =>
        throw new NotSupportedException(
            "No SQLite provider has been selected. Pin the Emby runtime first.");
}
