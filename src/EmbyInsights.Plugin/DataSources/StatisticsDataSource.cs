using EmbyInsights.Models;

namespace EmbyInsights.DataSources;

/// <summary>Optional supplementary adapter for the installed Statistics plugin.</summary>
public sealed class StatisticsDataSource : IPlaybackDataSource
{
    public string Id => "statistics";
    public int Priority => 50;

    public Task<DataSourceStatus> GetStatusAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new DataSourceStatus(false,
            "TODO: inspect the installed Statistics plugin; use only verified, useful fields."));

    public async IAsyncEnumerable<SourcePlaybackRecord> ReadAsync(
        DateTimeOffset from, DateTimeOffset to,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        cancellationToken.ThrowIfCancellationRequested();
        yield break;
    }
}
