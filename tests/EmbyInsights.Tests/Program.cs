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

await Run("top items keep every media kind", async () =>
{
    var now = DateTimeOffset.UtcNow;
    var source = new ManyTopItemsSource(now);
    var items = await new PlaybackReportingStatisticsReader(source)
        .TopItemsAsync(now.AddDays(-1), now.AddDays(1), 10);

    Equal(10, items.Count(x => x.MediaKind == nameof(MediaKind.Movie)));
    Equal(1, items.Count(x => x.MediaKind == nameof(MediaKind.Episode)));
    Equal("Episode", items.Single(x => x.MediaKind == nameof(MediaKind.Episode)).Name);
});

await Run("playback reporting library filter", async () =>
{
    var now = DateTimeOffset.UtcNow;
    var included = await new PlaybackReportingStatisticsReader(new FakeSource(), row => row.ItemId == "i1")
        .OverviewAsync(now.AddDays(-1), now.AddDays(1));
    var excluded = await new PlaybackReportingStatisticsReader(new FakeSource(), _ => false)
        .OverviewAsync(now.AddDays(-1), now.AddDays(1));
    Equal(1, included.PlaybackCount);
    Equal(0, excluded.PlaybackCount);
});

await Run("playback reporting detailed transcode methods", () =>
{
    Equal(PlaybackMethod.Transcode, PlaybackReportingDataSource.ParsePlaybackMethod("Transcode (v:h264 a:ac3)"));
    Equal(PlaybackMethod.Transcode, PlaybackReportingDataSource.ParsePlaybackMethod("Transcode (v:direct a:mp3)"));
    Equal(PlaybackMethod.DirectStream, PlaybackReportingDataSource.ParsePlaybackMethod("DirectStream"));
    Equal(PlaybackMethod.Unknown, PlaybackReportingDataSource.ParsePlaybackMethod(null));
    Equal(PlaybackMethod.Unknown, PlaybackReportingDataSource.ParsePlaybackMethod("   "));
    Equal(MediaKind.Unknown, PlaybackReportingDataSource.ParseMediaKind(null));
    Equal(MediaKind.Unknown, PlaybackReportingDataSource.ParseMediaKind("   "));
    return Task.CompletedTask;
});

await Run("user playback method counts", async () =>
{
    var now = DateTimeOffset.UtcNow;
    var users = await new PlaybackReportingStatisticsReader(new UserMethodsSource(now))
        .UsersAsync(now.AddDays(-1), now.AddDays(1), id => id);
    Equal(1, users.Count);
    Equal(3, users[0].PlayCount);
    Equal(1, users[0].DirectPlayCount);
    Equal(1, users[0].TranscodeCount);
    var devices = await new PlaybackReportingStatisticsReader(new UserMethodsSource(now))
        .DevicesAsync(now.AddDays(-1), now.AddDays(1));
    Equal(1, devices.Count);
    Equal(1, devices[0].TranscodeCount);
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

        Equal(true, records.Count > 0);
        Equal(true, records.All(x => x.WatchedTicks >= 0));
        Equal(true, records.Any(x => x.MediaKind == MediaKind.Episode));
        Equal(true, records.Any(x => x.MediaKind == MediaKind.Movie));
        Equal(true, records.Any(x => x.PlaybackMethod == PlaybackMethod.Transcode));
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

file sealed class ManyTopItemsSource(DateTimeOffset now) : IPlaybackDataSource
{
    public string Id => "many-top-items"; public int Priority => 1;
    public Task<DataSourceStatus> GetStatusAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new DataSourceStatus(true));
    public async IAsyncEnumerable<SourcePlaybackRecord> ReadAsync(DateTimeOffset from, DateTimeOffset to,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        for (var index = 0; index < 10; index++)
            yield return new($"movie-{index}", "u1", $"m{index}", $"Movie {index}", MediaKind.Movie,
                now, now.AddHours(1), TimeSpan.FromHours(1).Ticks, PlaybackMethod.DirectPlay);
        yield return new("episode", "u1", "e1", "Episode", MediaKind.Episode,
            now, now.AddMinutes(3), TimeSpan.FromMinutes(3).Ticks, PlaybackMethod.DirectPlay);
    }
}

file sealed class UserMethodsSource(DateTimeOffset now) : IPlaybackDataSource
{
    public string Id => "user-methods"; public int Priority => 1;
    public Task<DataSourceStatus> GetStatusAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new DataSourceStatus(true));
    public async IAsyncEnumerable<SourcePlaybackRecord> ReadAsync(DateTimeOffset from, DateTimeOffset to,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask;
        yield return new("direct", "u1", "i1", "One", MediaKind.Movie, now, now.AddMinutes(1), TimeSpan.FromMinutes(1).Ticks, PlaybackMethod.DirectPlay);
        yield return new("transcode", "u1", "i2", "Two", MediaKind.Movie, now, now.AddMinutes(1), TimeSpan.FromMinutes(1).Ticks, PlaybackMethod.Transcode);
        yield return new("stream", "u1", "i3", "Three", MediaKind.Movie, now, now.AddMinutes(1), TimeSpan.FromMinutes(1).Ticks, PlaybackMethod.DirectStream);
    }
}
