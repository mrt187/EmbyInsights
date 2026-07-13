using EmbyInsights.DataSources;
using EmbyInsights.Models;
using EmbyInsights.Persistence;
using EmbyInsights.Services;

await Run("statistics aggregation", async () =>
{
    var repository = new InMemoryPlaybackRepository();
    var now = DateTimeOffset.UtcNow;
    await repository.AddAsync(Record("a", "u1", MediaKind.Movie, PlaybackMethod.DirectPlay, TimeSpan.FromHours(2), now));
    await repository.AddAsync(Record("b", "u2", MediaKind.Episode, PlaybackMethod.Transcode, TimeSpan.FromMinutes(30), now));
    var result = await new StatisticsService(repository).GetOverviewAsync(new(now.AddDays(-1), now.AddDays(1)));
    Equal(2, result.PlaybackCount); Equal(2, result.ActiveUsers); Equal(50d, result.DirectPlayPercentage);
    Equal(TimeSpan.FromMinutes(150), result.WatchTime);
});

await Run("import deduplication", async () =>
{
    var repository = new InMemoryPlaybackRepository();
    var source = new FakeSource();
    var importer = new PlaybackImportService([source], repository);
    var now = DateTimeOffset.UtcNow;
    Equal(1, (await importer.ImportAsync(now.AddDays(-1), now.AddDays(1))).ImportedRecords);
    Equal(0, (await importer.ImportAsync(now.AddDays(-1), now.AddDays(1))).ImportedRecords);
});

var playbackReportingDatabase = Environment.GetEnvironmentVariable("PLAYBACK_REPORTING_DB");
if (!string.IsNullOrWhiteSpace(playbackReportingDatabase))
{
    await Run("playback reporting read-only integration", async () =>
    {
        var source = new PlaybackReportingDataSource(playbackReportingDatabase);
        var status = await source.GetStatusAsync();
        if (!status.IsAvailable) throw new InvalidOperationException(status.Detail);

        var records = new List<SourcePlaybackRecord>();
        await foreach (var record in source.ReadAsync(DateTimeOffset.UtcNow.AddDays(-7), DateTimeOffset.UtcNow.AddDays(1)))
            records.Add(record);

        var bourne = records.Single(x => x.UserId == "7f451bbbe3c749c696d2a4606a0be12b");
        Equal("Die Bourne Verschwörung", bourne.ItemName);
        Equal(MediaKind.Movie, bourne.MediaKind);
        Equal(PlaybackMethod.DirectStream, bourne.PlaybackMethod);
        Equal(TimeSpan.FromSeconds(191).Ticks, bourne.WatchedTicks);
    });
}

Console.WriteLine("All tests passed.");

static PlaybackRecord Record(string sourceRecord, string user, MediaKind kind, PlaybackMethod method, TimeSpan duration, DateTimeOffset now) =>
    new(Guid.NewGuid(), sourceRecord, user, sourceRecord, sourceRecord, kind, now.Add(-duration), now,
        duration.Ticks, method, SourceId: "test", SourceRecordId: sourceRecord);

static async Task Run(string name, Func<Task> test)
{
    await test(); Console.WriteLine($"PASS {name}");
}

static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
        throw new InvalidOperationException($"Expected {expected}, got {actual}.");
}

file sealed class FakeSource : IPlaybackDataSource
{
    public string Id => "fake"; public int Priority => 1;
    public Task<DataSourceStatus> GetStatusAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new DataSourceStatus(true));
    public async IAsyncEnumerable<SourcePlaybackRecord> ReadAsync(DateTimeOffset from, DateTimeOffset to,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        yield return new("stable-1", "u1", "i1", "Movie", MediaKind.Movie,
            from.AddHours(1), from.AddHours(2), TimeSpan.FromHours(1).Ticks, PlaybackMethod.DirectPlay);
    }
}
