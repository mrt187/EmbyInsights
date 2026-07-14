using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;

namespace EmbyInsights.Services;

public sealed class ServerLibraryStatisticsService(
    ILibraryManager library,
    bool filterEnabled = false,
    IReadOnlyList<string>? includedLibraryPaths = null)
{
    public ServerLibraryOverviewDto GetOverview()
    {
        var paths = includedLibraryPaths?.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? [];
        if (filterEnabled && paths.Length == 0)
            return new ServerLibraryOverviewDto(0, 0, 0, 0, 0, 0, 0, "0 B");

        var movies = Count("Movie", paths);
        var series = Count("Series", paths);
        var episodes = Count("Episode", paths);
        var songs = Count("Audio", paths);
        var mediaQuery = new InternalItemsQuery
        {
            Recursive = true,
            IsFolder = false,
            HasPath = true
        };
        if (filterEnabled) mediaQuery.PathStartsWithAny = paths;
        var media = library.GetItemList(mediaQuery);

        // MusicAlbum folders do not carry a path in Emby. A path filter therefore
        // has to count the distinct album ids of the selected audio tracks instead.
        var musicAlbums = filterEnabled
            ? media.OfType<MediaBrowser.Controller.Entities.Audio.Audio>()
                .Select(item => item.AlbumId)
                .Where(id => id > 0)
                .Distinct()
                .Count()
            : Count("MusicAlbum", []);
        var totalBytes = media.Where(item => item.Size > 0).Sum(item => item.Size);
        return new ServerLibraryOverviewDto(movies, series, episodes, musicAlbums, songs, media.Length, totalBytes, FormatBytes(totalBytes));
    }

    private int Count(string itemType, string[] paths)
    {
        var query = new InternalItemsQuery
        {
            Recursive = true,
            IncludeItemTypes = [itemType],
            EnableTotalRecordCount = true,
            Limit = 0
        };
        if (filterEnabled) query.PathStartsWithAny = paths;
        return library.GetItemsResult(query).TotalRecordCount;
    }

    internal static string FormatBytes(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB", "TB", "PB"];
        var value = (double)Math.Max(0, bytes);
        var unit = 0;
        while (value >= 1024 && unit < units.Length - 1) { value /= 1024; unit++; }
        return $"{Math.Round(value, MidpointRounding.AwayFromZero):0} {units[unit]}";
    }
}

public sealed record ServerLibraryOverviewDto(
    int Movies,
    int Series,
    int Episodes,
    int MusicAlbums,
    int Songs,
    int MediaFiles,
    long TotalBytes,
    string TotalSize);
