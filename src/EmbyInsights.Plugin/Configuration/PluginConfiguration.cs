using MediaBrowser.Model.Plugins;

namespace EmbyInsights.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public string Language { get; set; } = "de";
    public string Theme { get; set; } = "emerald";
    public bool LibraryFilterEnabled { get; set; }
    public string[] IncludedLibraryPaths { get; set; } = [];
}
