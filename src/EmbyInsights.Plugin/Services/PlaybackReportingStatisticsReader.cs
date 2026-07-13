using EmbyInsights.DataSources;
using EmbyInsights.Models;

namespace EmbyInsights.Services;

public sealed class PlaybackReportingStatisticsReader(IPlaybackDataSource source)
{
    public async Task<InsightsOverviewDto> OverviewAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken token = default)
    {
        var rows = await ReadAsync(from, to, token).ConfigureAwait(false);
        var seconds = rows.Sum(x => x.WatchedTicks) / TimeSpan.TicksPerSecond;
        var directPlay = rows.Count(x => x.PlaybackMethod == PlaybackMethod.DirectPlay);
        return new InsightsOverviewDto
        {
            From = from,
            To = to,
            WatchSeconds = seconds,
            WatchTime = FormatDuration(seconds),
            PlaybackCount = rows.Count,
            ActiveUsers = rows.Select(x => x.UserId).Where(x => x.Length > 0).Distinct().Count(),
            Movies = rows.Count(x => x.MediaKind == MediaKind.Movie),
            Episodes = rows.Count(x => x.MediaKind == MediaKind.Episode),
            DirectPlayPercentage = rows.Count == 0 ? 0 : Math.Round(directPlay * 100d / rows.Count, 1)
        };
    }

    public async Task<IReadOnlyList<InsightsActivityDto>> ActivityAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken token = default)
    {
        var rows = await ReadAsync(from, to, token).ConfigureAwait(false);
        return rows.GroupBy(x => DateOnly.FromDateTime(x.StartedAt.LocalDateTime))
            .OrderBy(x => x.Key)
            .Select(x => new InsightsActivityDto
            {
                Date = x.Key.ToString("yyyy-MM-dd"),
                WatchSeconds = x.Sum(r => r.WatchedTicks) / TimeSpan.TicksPerSecond,
                PlaybackCount = x.Count()
            }).ToArray();
    }

    public async Task<IReadOnlyList<InsightsTopItemDto>> TopItemsAsync(
        DateTimeOffset from, DateTimeOffset to, int limit, CancellationToken token = default)
    {
        var rows = await ReadAsync(from, to, token).ConfigureAwait(false);
        return rows.GroupBy(x => new { x.ItemId, x.ItemName, x.MediaKind })
            .Select(x => new InsightsTopItemDto
            {
                ItemId = x.Key.ItemId,
                Name = x.Key.ItemName,
                MediaKind = x.Key.MediaKind.ToString(),
                WatchSeconds = x.Sum(r => r.WatchedTicks) / TimeSpan.TicksPerSecond,
                PlayCount = x.Count()
            })
            .OrderByDescending(x => x.WatchSeconds).ThenBy(x => x.Name)
            .Take(Math.Clamp(limit, 1, 100)).ToArray();
    }

    public async Task<IReadOnlyList<InsightsUserDto>> UsersAsync(
        DateTimeOffset from, DateTimeOffset to, Func<string, string> resolveName, CancellationToken token = default)
    {
        var rows = await ReadAsync(from, to, token).ConfigureAwait(false);
        return rows.Where(x => x.UserId.Length > 0).GroupBy(x => x.UserId)
            .Select(x => new InsightsUserDto
            {
                UserId = x.Key,
                Name = resolveName(x.Key),
                WatchSeconds = x.Sum(r => r.WatchedTicks) / TimeSpan.TicksPerSecond,
                PlayCount = x.Count(),
                Movies = x.Count(r => r.MediaKind == MediaKind.Movie),
                Episodes = x.Count(r => r.MediaKind == MediaKind.Episode),
                LastActivity = x.Max(r => r.EndedAt)
            }).OrderByDescending(x => x.WatchSeconds).ToArray();
    }

    public async Task<IReadOnlyList<InsightsDeviceDto>> DevicesAsync(
        DateTimeOffset from, DateTimeOffset to, CancellationToken token = default)
    {
        var rows = await ReadAsync(from, to, token).ConfigureAwait(false);
        return rows.GroupBy(x => new { Client = x.ClientName ?? "Unbekannt", Device = x.DeviceName ?? "Unbekannt" })
            .Select(x => new InsightsDeviceDto
            {
                ClientName = x.Key.Client,
                DeviceName = x.Key.Device,
                WatchSeconds = x.Sum(r => r.WatchedTicks) / TimeSpan.TicksPerSecond,
                PlayCount = x.Count()
            }).OrderByDescending(x => x.WatchSeconds).ToArray();
    }

    public async Task<IReadOnlyList<InsightsPlaybackMethodDto>> PlaybackMethodsAsync(
        DateTimeOffset from, DateTimeOffset to, CancellationToken token = default)
    {
        var rows = await ReadAsync(from, to, token).ConfigureAwait(false);
        return rows.GroupBy(x => x.PlaybackMethod)
            .Select(x => new InsightsPlaybackMethodDto
            {
                Method = x.Key.ToString(),
                WatchSeconds = x.Sum(r => r.WatchedTicks) / TimeSpan.TicksPerSecond,
                PlayCount = x.Count(),
                Percentage = rows.Count == 0 ? 0 : Math.Round(x.Count() * 100d / rows.Count, 1)
            }).OrderByDescending(x => x.PlayCount).ToArray();
    }

    private async Task<List<SourcePlaybackRecord>> ReadAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken token)
    {
        var rows = new List<SourcePlaybackRecord>();
        await foreach (var row in source.ReadAsync(from, to, token).ConfigureAwait(false)) rows.Add(row);
        return rows;
    }

    private static string FormatDuration(long seconds)
    {
        var duration = TimeSpan.FromSeconds(seconds);
        var totalHours = (long)duration.TotalHours;
        return totalHours > 0 ? $"{totalHours} Std. {duration.Minutes} Min." : $"{duration.Minutes} Min.";
    }
}

public sealed class InsightsOverviewDto
{
    public DateTimeOffset From { get; set; }
    public DateTimeOffset To { get; set; }
    public long WatchSeconds { get; set; }
    public string WatchTime { get; set; } = string.Empty;
    public int PlaybackCount { get; set; }
    public int ActiveUsers { get; set; }
    public int Movies { get; set; }
    public int Episodes { get; set; }
    public double DirectPlayPercentage { get; set; }
}

public sealed class InsightsActivityDto
{
    public string Date { get; set; } = string.Empty;
    public long WatchSeconds { get; set; }
    public int PlaybackCount { get; set; }
}

public sealed class InsightsTopItemDto
{
    public string ItemId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string MediaKind { get; set; } = string.Empty;
    public long WatchSeconds { get; set; }
    public int PlayCount { get; set; }
    public string? SeriesItemId { get; set; }
    public string? SeriesName { get; set; }
}

public sealed class InsightsUserDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long WatchSeconds { get; set; }
    public int PlayCount { get; set; }
    public int Movies { get; set; }
    public int Episodes { get; set; }
    public DateTimeOffset LastActivity { get; set; }
}

public sealed class InsightsDeviceDto
{
    public string ClientName { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public long WatchSeconds { get; set; }
    public int PlayCount { get; set; }
}

public sealed class InsightsPlaybackMethodDto
{
    public string Method { get; set; } = string.Empty;
    public long WatchSeconds { get; set; }
    public int PlayCount { get; set; }
    public double Percentage { get; set; }
}
