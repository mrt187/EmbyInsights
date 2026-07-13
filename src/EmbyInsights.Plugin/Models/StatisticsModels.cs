namespace EmbyInsights.Models;

public sealed record StatisticsQuery(DateTimeOffset From, DateTimeOffset To, string? UserId = null);

public sealed record OverviewStatistics(
    TimeSpan WatchTime,
    int PlaybackCount,
    int ActiveUsers,
    int Movies,
    int Episodes,
    double DirectPlayPercentage);

public sealed record ActivityPoint(DateOnly Date, TimeSpan WatchTime, int PlaybackCount);

public sealed record TopItem(string ItemId, string Name, MediaKind MediaKind, TimeSpan WatchTime, int PlayCount);

public sealed record UserStatistics(string UserId, TimeSpan WatchTime, int PlayCount, DateTimeOffset LastActivity);
