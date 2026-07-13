using System.Globalization;
using EmbyInsights.Models;
using SQLitePCL.pretty;

namespace EmbyInsights.DataSources;

/// <summary>Read-only adapter for Playback Reporting 2.1.x.</summary>
public sealed class PlaybackReportingDataSource(string databasePath) : IPlaybackDataSource
{
    private static readonly string[] DateFormats =
    [
        "yyyy-MM-dd HH:mm:ss.FFFFFFFK", "yyyy-MM-dd HH:mm:ssK", "yyyy-MM-dd HH:mmK",
        "yyyy-MM-ddTHH:mm:ss.FFFFFFFK", "yyyy-MM-ddTHH:mm:ssK",
        "yyyy-MM-dd HH:mm:ss.FFFFFFF", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd HH:mm"
    ];

    public string Id => "playback-reporting";
    public int Priority => 100;

    public Task<DataSourceStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!File.Exists(databasePath))
            return Task.FromResult(new DataSourceStatus(false, "Playback Reporting database not found."));

        try
        {
            using var connection = OpenReadOnly();
            using var statement = connection.PrepareStatement(
                "SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name='PlaybackActivity'");
            var available = statement.MoveNext() && statement.Current.GetString(0) == "1";
            return Task.FromResult(new DataSourceStatus(available,
                available ? "Playback Reporting schema detected (read-only)." : "PlaybackActivity table not found."));
        }
        catch (Exception exception)
        {
            return Task.FromResult(new DataSourceStatus(false, exception.Message));
        }
    }

    public async IAsyncEnumerable<SourcePlaybackRecord> ReadAsync(
        DateTimeOffset from, DateTimeOffset to,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        using var connection = OpenReadOnly();
        using var statement = connection.PrepareStatement("""
            SELECT rowid, DateCreated, UserId, ItemId, ItemType, ItemName,
                   PlaybackMethod, ClientName, DeviceName,
                   MAX(0, COALESCE(PlayDuration, 0) - COALESCE(PauseDuration, 0))
            FROM PlaybackActivity
            WHERE DateCreated >= @from AND DateCreated < @to
            ORDER BY DateCreated, rowid
            """);

        Bind(statement, "@from", SqlDate(from));
        Bind(statement, "@to", SqlDate(to));

        while (statement.MoveNext())
        {
            cancellationToken.ThrowIfCancellationRequested();
            var row = statement.Current;
            var started = ParseDate(row.GetString(1));
            var seconds = ParseLong(row.GetString(9));
            yield return new SourcePlaybackRecord(
                row.GetString(0), Nullable(row.GetString(2)), Nullable(row.GetString(3)),
                Nullable(row.GetString(5)), ParseMediaKind(row.GetString(4)), started,
                started.AddSeconds(seconds), TimeSpan.FromSeconds(seconds).Ticks,
                ParsePlaybackMethod(row.GetString(6)), NullIfEmpty(row.GetString(7)), NullIfEmpty(row.GetString(8)));
        }
    }

    private IDatabaseConnection OpenReadOnly() => SQLite3.Open(databasePath,
        ConnectionFlags.ReadOnly | ConnectionFlags.PrivateCache | ConnectionFlags.NoMutex, null, true);

    private static void Bind(IStatement statement, string name, string value)
    {
        if (statement.BindParameters.TryGetValue(name, out var parameter)) parameter.Bind(value);
    }

    private static string SqlDate(DateTimeOffset value) =>
        value.LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss.FFFFFFF", CultureInfo.InvariantCulture);

    private static DateTimeOffset ParseDate(string value)
    {
        var parsed = DateTime.ParseExact(value, DateFormats, CultureInfo.InvariantCulture,
            DateTimeStyles.AllowWhiteSpaces);
        return new DateTimeOffset(DateTime.SpecifyKind(parsed, DateTimeKind.Local)).ToUniversalTime();
    }

    private static long ParseLong(string value) =>
        long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) ? parsed : 0;

    internal static MediaKind ParseMediaKind(string? value) => (value ?? string.Empty).Trim().ToLowerInvariant() switch
    {
        "movie" => MediaKind.Movie, "episode" => MediaKind.Episode, "audio" => MediaKind.Audio,
        "unknown" or "" => MediaKind.Unknown, _ => MediaKind.Other
    };

    internal static PlaybackMethod ParsePlaybackMethod(string? value)
    {
        var normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
        if (normalized.StartsWith("transcode", StringComparison.Ordinal)) return PlaybackMethod.Transcode;
        return normalized switch
        {
            "directplay" => PlaybackMethod.DirectPlay,
            "directstream" => PlaybackMethod.DirectStream,
            _ => PlaybackMethod.Unknown
        };
    }

    private static string Nullable(string? value) => value ?? string.Empty;
    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
