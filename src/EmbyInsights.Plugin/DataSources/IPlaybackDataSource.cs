using EmbyInsights.Models;

namespace EmbyInsights.DataSources;

public interface IPlaybackDataSource
{
    string Id { get; }
    int Priority { get; }
    Task<DataSourceStatus> GetStatusAsync(CancellationToken cancellationToken = default);
    IAsyncEnumerable<SourcePlaybackRecord> ReadAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        CancellationToken cancellationToken = default);
}

public sealed record DataSourceStatus(bool IsAvailable, string? Detail = null);

public sealed record SourcePlaybackRecord(
    string SourceRecordId,
    string UserId,
    string ItemId,
    string ItemName,
    MediaKind MediaKind,
    DateTimeOffset StartedAt,
    DateTimeOffset EndedAt,
    long WatchedTicks,
    PlaybackMethod PlaybackMethod,
    string? ClientName = null,
    string? DeviceName = null);
