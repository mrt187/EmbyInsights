using EmbyInsights.DataSources;
using EmbyInsights.Services;
using MediaBrowser.Controller.Api;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Net;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Querying;
using MediaBrowser.Model.Services;

namespace EmbyInsights.Api;

[Route("/EmbyInsights/Overview", "GET", Summary = "Returns the Emby Insights overview")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsOverview : IReturn<InsightsOverviewDto>
{
    public string Range { get; set; } = "30d";
}

[Route("/EmbyInsights/Activity", "GET", Summary = "Returns daily playback activity")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsActivity : IReturn<InsightsActivityDto[]>
{
    public string Range { get; set; } = "30d";
}

[Route("/EmbyInsights/TopItems", "GET", Summary = "Returns top played media")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsTopItems : IReturn<InsightsTopItemDto[]>
{
    public string Range { get; set; } = "30d";
    public int Limit { get; set; } = 10;
}

[Route("/EmbyInsights/Users", "GET", Summary = "Returns playback statistics by user")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsUsers : IReturn<InsightsUserDto[]>
{
    public string Range { get; set; } = "30d";
}

[Route("/EmbyInsights/Devices", "GET", Summary = "Returns playback statistics by client and device")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsDevices : IReturn<InsightsDeviceDto[]>
{
    public string Range { get; set; } = "30d";
}

[Route("/EmbyInsights/PlaybackMethods", "GET", Summary = "Returns playback method distribution")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsPlaybackMethods : IReturn<InsightsPlaybackMethodDto[]>
{
    public string Range { get; set; } = "30d";
}

[Route("/EmbyInsights/ServerOverview", "GET", Summary = "Returns global Emby library statistics")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsServerOverview : IReturn<ServerLibraryOverviewDto>
{
}

public sealed class PlaybackReportingStatisticsApi(
    IServerConfigurationManager configuration,
    IUserManager users,
    ILibraryManager library) : BaseApiService
{
    public object Get(GetInsightsOverview request)
    {
        var (from, to) = DateRange(request.Range);
        return Reader().OverviewAsync(from, to).GetAwaiter().GetResult();
    }

    public object Get(GetInsightsActivity request)
    {
        var (from, to) = DateRange(request.Range);
        return Reader().ActivityAsync(from, to).GetAwaiter().GetResult();
    }

    public object Get(GetInsightsTopItems request)
    {
        var (from, to) = DateRange(request.Range);
        var items = Reader().TopItemsAsync(from, to, request.Limit).GetAwaiter().GetResult();
        foreach (var item in items.Where(x => x.MediaKind.Equals("Episode", StringComparison.OrdinalIgnoreCase)))
        {
            if (!Guid.TryParse(item.ItemId, out var episodeId)) continue;
            var episode = library.GetItemById(episodeId);
            if (episode is null || episode.SeriesId <= 0) continue;
            var series = library.GetItemById(episode.SeriesId);
            if (series is null) continue;
            item.SeriesItemId = series.IdString;
            item.SeriesName = series.Name;
        }
        return items;
    }

    public object Get(GetInsightsUsers request)
    {
        var (from, to) = DateRange(request.Range);
        var names = users.GetUserList(new UserQuery()).ToDictionary(x => x.Id.ToString("N"), x => x.Name);
        return Reader().UsersAsync(from, to, id => names.TryGetValue(id, out var name) ? name : id).GetAwaiter().GetResult();
    }

    public object Get(GetInsightsDevices request)
    {
        var (from, to) = DateRange(request.Range);
        return Reader().DevicesAsync(from, to).GetAwaiter().GetResult();
    }

    public object Get(GetInsightsPlaybackMethods request)
    {
        var (from, to) = DateRange(request.Range);
        return Reader().PlaybackMethodsAsync(from, to).GetAwaiter().GetResult();
    }

    public object Get(GetInsightsServerOverview request) => new ServerLibraryStatisticsService(library).GetOverview();

    private PlaybackReportingStatisticsReader Reader()
    {
        var database = Path.Combine(configuration.ApplicationPaths.DataPath, "playback_reporting.db");
        return new PlaybackReportingStatisticsReader(new PlaybackReportingDataSource(database));
    }

    private static (DateTimeOffset From, DateTimeOffset To) DateRange(string? range)
    {
        var now = DateTimeOffset.UtcNow;
        var from = range?.ToLowerInvariant() switch
        {
            "7d" => now.AddDays(-7),
            "year" => new DateTimeOffset(now.Year, 1, 1, 0, 0, 0, TimeSpan.Zero),
            "all" => new DateTimeOffset(2000, 1, 1, 0, 0, 0, TimeSpan.Zero),
            _ => now.AddDays(-30)
        };
        return (from, now.AddSeconds(1));
    }
}
