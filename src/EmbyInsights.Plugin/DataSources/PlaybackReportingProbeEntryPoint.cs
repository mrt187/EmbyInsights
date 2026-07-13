using MediaBrowser.Controller.Configuration;
using MediaBrowser.Controller.Plugins;
using MediaBrowser.Model.Logging;
using EmbyInsights.Services;

namespace EmbyInsights.DataSources;

/// <summary>Validates the optional Playback Reporting source once at server startup.</summary>
public sealed class PlaybackReportingProbeEntryPoint : IServerEntryPoint
{
    private readonly IServerConfigurationManager _configuration;
    private readonly ILogger _logger;

    public PlaybackReportingProbeEntryPoint(IServerConfigurationManager configuration, ILogManager logs)
    {
        _configuration = configuration;
        _logger = logs.GetLogger("EmbyInsights - PlaybackReporting");
    }

    public void Run()
    {
        var path = Path.Combine(_configuration.ApplicationPaths.DataPath, "playback_reporting.db");
        var source = new PlaybackReportingDataSource(path);
        var status = source.GetStatusAsync().GetAwaiter().GetResult();
        if (status.IsAvailable)
        {
            var overview = new PlaybackReportingStatisticsReader(source)
                .OverviewAsync(DateTimeOffset.UtcNow.AddDays(-30), DateTimeOffset.UtcNow.AddSeconds(1))
                .GetAwaiter().GetResult();
            _logger.Info("Read-only source ready: {0}; 30d plays={1}, watchSeconds={2}, users={3}",
                path, overview.PlaybackCount, overview.WatchSeconds, overview.ActiveUsers);
        }
        else
            _logger.Warn("Read-only source unavailable: {0}", status.Detail ?? "unknown reason");
    }

    public void Dispose()
    {
    }
}
