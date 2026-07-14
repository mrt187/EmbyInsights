using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Plugins;
using MediaBrowser.Model.Logging;

namespace EmbyInsights.ServerEntryPoints;

/// <summary>
/// Self-healing installer for the home screen tab: on every server start, copies the
/// embedded web client assets into dashboard-ui and patches index.html to load them.
/// Survives Emby container image updates, which reset dashboard-ui to its shipped state.
/// Any failure (missing dashboard-ui, no write access, unexpected file layout) is logged
/// and swallowed here - it must never prevent the Emby server from starting.
/// </summary>
public sealed class WebClientTabEntryPoint : IServerEntryPoint
{
    private const string ResourcePrefix = "EmbyInsights.WebClientExtension";

    private readonly IServerConfigurationManager _configuration;
    private readonly ILogger _logger;

    public WebClientTabEntryPoint(IServerConfigurationManager configuration, ILogManager logs)
    {
        _configuration = configuration;
        _logger = logs.GetLogger("EmbyInsights - WebClient");
    }

    public void Run()
    {
        try
        {
            InstallWebClientExtension();
        }
        catch (Exception ex)
        {
            _logger.Warn("Web client tab could not be installed: {0}", ex.Message);
        }
    }

    private void InstallWebClientExtension()
    {
        var dashboardUiPath = Path.Combine(_configuration.ApplicationPaths.ProgramSystemPath, "dashboard-ui");
        var indexPath = Path.Combine(dashboardUiPath, "index.html");
        if (!Directory.Exists(dashboardUiPath) || !File.Exists(indexPath))
        {
            _logger.Warn("dashboard-ui not found at {0}; skipping web client tab installation.", dashboardUiPath);
            return;
        }

        var version = typeof(Plugin.Plugin).Assembly.GetName().Version?.ToString() ?? "0";
        var insightsDir = Path.Combine(dashboardUiPath, "emby-insights");
        Directory.CreateDirectory(insightsDir);

        ExtractResource("statistics-tab.global.js", Path.Combine(dashboardUiPath, "emby-insights-tab.js"));
        ExtractResource("statistics.html", Path.Combine(insightsDir, "dashboard.html"));
        ExtractResource("statistics.js", Path.Combine(insightsDir, "dashboard.js"));

        PatchIndexHtml(indexPath, version);
    }

    private void ExtractResource(string resourceName, string destinationPath)
    {
        var logicalName = $"{ResourcePrefix}.{resourceName}";
        using var stream = typeof(Plugin.Plugin).Assembly.GetManifestResourceStream(logicalName)
            ?? throw new InvalidOperationException($"Embedded resource missing: {logicalName}");

        var tempPath = destinationPath + ".tmp";
        using (var file = File.Create(tempPath))
        {
            stream.CopyTo(file);
        }

        File.Move(tempPath, destinationPath, overwrite: true);
    }

    private void PatchIndexHtml(string indexPath, string version)
    {
        var html = File.ReadAllText(indexPath);
        if (!html.Contains("</body>", StringComparison.Ordinal))
        {
            _logger.Warn("index.html at {0} has no </body> marker; skipping web client tab installation.", indexPath);
            return;
        }

        var updated = IndexHtmlPatcher.UpsertScriptTag(html, "emby-insights-tab.js", version);
        updated = IndexHtmlPatcher.UpsertScriptTag(updated, "emby-insights/dashboard.js", version);
        if (updated == html)
        {
            return;
        }

        var tempPath = indexPath + ".tmp";
        File.WriteAllText(tempPath, updated);
        File.Move(tempPath, indexPath, overwrite: true);
    }

    public void Dispose()
    {
    }
}
