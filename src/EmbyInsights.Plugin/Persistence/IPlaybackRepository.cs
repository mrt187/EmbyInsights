using EmbyInsights.Models;

namespace EmbyInsights.Persistence;

public interface IPlaybackRepository
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
    Task AddAsync(PlaybackRecord record, CancellationToken cancellationToken = default);
    Task<bool> ContainsAsync(PlaybackIdentity identity, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PlaybackRecord>> QueryAsync(StatisticsQuery query, CancellationToken cancellationToken = default);
    Task DeleteBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default);
}
