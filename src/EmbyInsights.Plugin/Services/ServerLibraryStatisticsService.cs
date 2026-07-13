using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;

namespace EmbyInsights.Services;

public sealed class ServerLibraryStatisticsService(ILibraryManager library)
{
    public ServerLibraryOverviewDto GetOverview()
    {
        var movies = Count("Movie");
        var series = Count("Series");
        var episodes = Count("Episode");
        var musicAlbums = Count("MusicAlbum");
        var songs = Count("Audio");
        var media = library.GetItemList(new InternalItemsQuery
        {
            Recursive = true,
            IsFolder = false,
            HasPath = true
        });

        var totalBytes = media.Where(item => item.Size > 0).Sum(item => item.Size);
        return new ServerLibraryOverviewDto(movies, series, episodes, musicAlbums, songs, media.Length, totalBytes, FormatBytes(totalBytes));
    }

    private int Count(string itemType) => library.GetItemsResult(new InternalItemsQuery
    {
        Recursive = true,
        IncludeItemTypes = [itemType],
        EnableTotalRecordCount = true,
        Limit = 0
    }).TotalRecordCount;

    private static string FormatBytes(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB", "TB", "PB"];
        var value = (double)Math.Max(0, bytes);
        var unit = 0;
        while (value >= 1024 && unit < units.Length - 1) { value /= 1024; unit++; }
        return $"{value:0.#} {units[unit]}";
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
