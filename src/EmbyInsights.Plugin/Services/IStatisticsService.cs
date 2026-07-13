using EmbyInsights.Models;

namespace EmbyInsights.Services;

public interface IStatisticsService
{
    Task<OverviewStatistics> GetOverviewAsync(StatisticsQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ActivityPoint>> GetActivityAsync(StatisticsQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TopItem>> GetTopItemsAsync(StatisticsQuery query, int limit, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserStatistics>> GetUsersAsync(StatisticsQuery query, int limit, CancellationToken cancellationToken = default);
}
