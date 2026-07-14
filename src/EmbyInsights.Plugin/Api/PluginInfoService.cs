using System.Text;
using EmbyInsights.Plugin;
using MediaBrowser.Controller.Api;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;

namespace EmbyInsights.Api;

[Route("/EmbyInsights/Logs", "GET", Summary = "Returns recent Emby Insights log lines")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsLogs : IReturn<InsightsTextResult>
{
    public int MaxLines { get; set; } = 300;
}

[Route("/EmbyInsights/Readme", "GET", Summary = "Returns the Emby Insights README")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsReadme : IReturn<InsightsTextResult>
{
}

[Route("/EmbyInsights/Changelog", "GET", Summary = "Returns the Emby Insights changelog")]
[Authenticated(Roles = "Admin")]
public sealed class GetInsightsChangelog : IReturn<InsightsChangelogEntry[]>
{
}

public sealed class InsightsChangelogEntry
{
    public string Version { get; set; } = string.Empty;
    public string[] Notes { get; set; } = [];
}

public sealed class InsightsTextResult
{
    public string Text { get; set; } = string.Empty;
}

public sealed class PluginInfoService : BaseApiService
{
    public object Get(GetInsightsLogs request)
    {
        var maximum = Math.Clamp(request.MaxLines, 1, 2000);
        return new InsightsTextResult { Text = ReadLogs(maximum) };
    }

    public object Get(GetInsightsReadme request)
    {
        using var stream = typeof(PluginInfoService).Assembly.GetManifestResourceStream("EmbyInsights.README.md");
        if (stream is null) return new InsightsTextResult();
        using var reader = new StreamReader(stream);
        return new InsightsTextResult { Text = reader.ReadToEnd() };
    }

    public object Get(GetInsightsChangelog request)
    {
        using var stream = typeof(PluginInfoService).Assembly
            .GetManifestResourceStream("EmbyInsights.Configuration.changelog.json");
        if (stream is null) return Array.Empty<InsightsChangelogEntry>();

        var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return System.Text.Json.JsonSerializer.Deserialize<InsightsChangelogEntry[]>(stream, options)
            ?? Array.Empty<InsightsChangelogEntry>();
    }

    private static string ReadLogs(int maximum)
    {
        var path = EmbyInsights.Plugin.Plugin.Instance?.LogDirectoryPath;
        if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path)) return string.Empty;

        var file = new DirectoryInfo(path).GetFiles()
            .Where(x => x.Extension.Equals(".txt", StringComparison.OrdinalIgnoreCase)
                     || x.Extension.Equals(".log", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(x => x.LastWriteTimeUtc).FirstOrDefault();
        if (file is null) return string.Empty;

        var matches = new Queue<string>();
        using var stream = new FileStream(file.FullName, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using var reader = new StreamReader(stream, Encoding.UTF8, true);
        while (reader.ReadLine() is { } line)
        {
            if (!line.Contains("EmbyInsights", StringComparison.OrdinalIgnoreCase)
                && !line.Contains("Emby Insights", StringComparison.OrdinalIgnoreCase)) continue;
            matches.Enqueue(line);
            if (matches.Count > maximum) matches.Dequeue();
        }
        return string.Join("\n", matches);
    }
}
