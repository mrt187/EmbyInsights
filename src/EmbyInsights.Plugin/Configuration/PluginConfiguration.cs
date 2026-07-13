using MediaBrowser.Model.Plugins;

namespace EmbyInsights.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public bool TrackingEnabled { get; set; } = true;
    public bool PlaybackReportingEnabled { get; set; } = true;
    public int RetentionDays { get; set; }
    public int MinimumPlaybackSeconds { get; set; } = 30;
    public bool EnableWebClientExtension { get; set; } = true;
    public string Language { get; set; } = "de";
    public string Theme { get; set; } = "emerald";
    public bool LibraryFilterEnabled { get; set; }
    public string[] IncludedLibraryPaths { get; set; } = [];
}
