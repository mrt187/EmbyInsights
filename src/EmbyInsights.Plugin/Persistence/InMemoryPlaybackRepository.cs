using EmbyInsights.Models;

namespace EmbyInsights.Persistence;

/// <summary>Dependency-free repository for development and tests.</summary>
public sealed class InMemoryPlaybackRepository : IPlaybackRepository
{
    private readonly List<PlaybackRecord> _records = [];
    private readonly object _gate = new();

    public Task InitializeAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task AddAsync(PlaybackRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate) _records.Add(record);
        return Task.CompletedTask;
    }

    public Task<bool> ContainsAsync(PlaybackIdentity identity, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
            return Task.FromResult(_records.Any(x =>
                x.SourceId == identity.SourceId && x.SourceRecordId == identity.SourceRecordId));
    }

    public Task<IReadOnlyList<PlaybackRecord>> QueryAsync(StatisticsQuery query, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            IReadOnlyList<PlaybackRecord> result = _records
                .Where(x => x.StartedAt >= query.From && x.StartedAt < query.To)
                .Where(x => query.UserId is null || x.UserId == query.UserId)
                .ToArray();
            return Task.FromResult(result);
        }
    }

    public Task DeleteBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate) _records.RemoveAll(x => x.EndedAt < cutoff);
        return Task.CompletedTask;
    }
}
