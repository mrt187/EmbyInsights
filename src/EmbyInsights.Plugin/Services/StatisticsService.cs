using EmbyInsights.Models;
using EmbyInsights.Persistence;

namespace EmbyInsights.Services;

public sealed class StatisticsService(IPlaybackRepository repository) : IStatisticsService
{
    public async Task<OverviewStatistics> GetOverviewAsync(StatisticsQuery query, CancellationToken cancellationToken = default)
    {
        var rows = await repository.QueryAsync(query, cancellationToken).ConfigureAwait(false);
        var direct = rows.Count(x => x.PlaybackMethod == PlaybackMethod.DirectPlay);
        return new OverviewStatistics(
            TimeSpan.FromTicks(rows.Sum(x => x.WatchedTicks)), rows.Count,
            rows.Select(x => x.UserId).Distinct().Count(),
            rows.Count(x => x.MediaKind == MediaKind.Movie),
            rows.Count(x => x.MediaKind == MediaKind.Episode),
            rows.Count == 0 ? 0 : direct * 100d / rows.Count);
    }

    public async Task<IReadOnlyList<ActivityPoint>> GetActivityAsync(StatisticsQuery query, CancellationToken cancellationToken = default)
    {
        var rows = await repository.QueryAsync(query, cancellationToken).ConfigureAwait(false);
        return rows.GroupBy(x => DateOnly.FromDateTime(x.StartedAt.LocalDateTime))
            .OrderBy(x => x.Key)
            .Select(x => new ActivityPoint(x.Key, TimeSpan.FromTicks(x.Sum(r => r.WatchedTicks)), x.Count()))
            .ToArray();
    }

    public async Task<IReadOnlyList<TopItem>> GetTopItemsAsync(StatisticsQuery query, int limit, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(limit);
        var rows = await repository.QueryAsync(query, cancellationToken).ConfigureAwait(false);
        return rows.GroupBy(x => new { x.ItemId, x.ItemName, x.MediaKind })
            .OrderByDescending(x => x.Sum(r => r.WatchedTicks)).Take(limit)
            .Select(x => new TopItem(x.Key.ItemId, x.Key.ItemName, x.Key.MediaKind,
                TimeSpan.FromTicks(x.Sum(r => r.WatchedTicks)), x.Count())).ToArray();
    }

    public async Task<IReadOnlyList<UserStatistics>> GetUsersAsync(StatisticsQuery query, int limit, CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(limit);
        var rows = await repository.QueryAsync(query, cancellationToken).ConfigureAwait(false);
        return rows.GroupBy(x => x.UserId).OrderByDescending(x => x.Sum(r => r.WatchedTicks)).Take(limit)
            .Select(x => new UserStatistics(x.Key, TimeSpan.FromTicks(x.Sum(r => r.WatchedTicks)),
                x.Count(), x.Max(r => r.EndedAt))).ToArray();
    }
}
