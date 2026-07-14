using EmbyInsights.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Drawing;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace EmbyInsights.Plugin;

/// <summary>Emby Server entry point, compiled against Emby Stable 4.9.5 so it also rolls forward to Beta.</summary>
public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages, IHasThumbImage
{
    public static Plugin? Instance { get; private set; }

    public override string Name => PluginInfo.Name;
    public override string Description => PluginInfo.Description;
    public override Guid Id => PluginInfo.Id;

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer) => Instance = this;

    public string LogDirectoryPath => ApplicationPaths.LogDirectoryPath;
    public ImageFormat ThumbImageFormat => ImageFormat.Png;

    public Stream GetThumbImage() =>
        typeof(Plugin).Assembly.GetManifestResourceStream("EmbyInsights.thumb.png")
        ?? throw new InvalidOperationException("Embedded Emby Insights thumbnail is missing.");

    public IEnumerable<PluginPageInfo> GetPages()
    {
        const string configurationPrefix = "EmbyInsights.Configuration";
        const string resourcePrefix = "EmbyInsights.WebClientExtension";
        yield return new PluginPageInfo
        {
            Name = "EmbyInsights0202",
            EmbeddedResourcePath = $"{configurationPrefix}.configPage.html",
            IsMainConfigPage = true
        };
        yield return new PluginPageInfo
        {
            Name = "EmbyInsightsConfigJs0202",
            EmbeddedResourcePath = $"{configurationPrefix}.configPage.js"
        };
        yield return new PluginPageInfo
        {
            Name = "EmbyInsightsStatistics",
            EmbeddedResourcePath = $"{resourcePrefix}.statistics.html"
        };
        yield return new PluginPageInfo
        {
            Name = "EmbyInsightsStatisticsJs",
            EmbeddedResourcePath = $"{resourcePrefix}.statistics.js"
        };
        yield return new PluginPageInfo
        {
            Name = "EmbyInsightsCss",
            EmbeddedResourcePath = $"{resourcePrefix}.statistics.css"
        };
        yield return new PluginPageInfo
        {
            Name = "EmbyInsightsTabJs",
            EmbeddedResourcePath = $"{resourcePrefix}.statistics-tab.js"
        };
    }
}
