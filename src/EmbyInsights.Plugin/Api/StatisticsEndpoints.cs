using EmbyInsights.Models;
using EmbyInsights.Services;

namespace EmbyInsights.Api;

/// <summary>Framework-neutral endpoint handlers.</summary>
public sealed class StatisticsEndpoints(IStatisticsService statistics, IAdminAuthorization authorization)
{
    public async Task<OverviewStatistics> OverviewAsync(RequestContext context, StatisticsQuery query, CancellationToken cancellationToken = default)
    {
        authorization.EnsureAdministrator(context);
        return await statistics.GetOverviewAsync(query, cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<ActivityPoint>> ActivityAsync(RequestContext context, StatisticsQuery query, CancellationToken cancellationToken = default)
    {
        authorization.EnsureAdministrator(context);
        return await statistics.GetActivityAsync(query, cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<TopItem>> TopItemsAsync(RequestContext context, StatisticsQuery query, int limit = 10, CancellationToken cancellationToken = default)
    {
        authorization.EnsureAdministrator(context);
        return await statistics.GetTopItemsAsync(query, limit, cancellationToken).ConfigureAwait(false);
    }
}

public sealed record RequestContext(string? AuthenticatedUserId, bool IsAdministrator);

public interface IAdminAuthorization { void EnsureAdministrator(RequestContext context); }

public sealed class AdminAuthorization : IAdminAuthorization
{
    public void EnsureAdministrator(RequestContext context)
    {
        if (string.IsNullOrWhiteSpace(context.AuthenticatedUserId) || !context.IsAdministrator)
            throw new UnauthorizedAccessException("Administrator access is required.");
    }
}
