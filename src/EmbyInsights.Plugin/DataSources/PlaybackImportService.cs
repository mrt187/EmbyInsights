using EmbyInsights.Models;
using EmbyInsights.Persistence;

namespace EmbyInsights.DataSources;

public sealed class PlaybackImportService(
    IEnumerable<IPlaybackDataSource> dataSources,
    IPlaybackRepository repository)
{
    public async Task<ImportResult> ImportAsync(
        DateTimeOffset from, DateTimeOffset to,
        CancellationToken cancellationToken = default)
    {
        var imported = 0;
        var skippedSources = new List<string>();

        foreach (var source in dataSources.OrderByDescending(x => x.Priority))
        {
            var status = await source.GetStatusAsync(cancellationToken).ConfigureAwait(false);
            if (!status.IsAvailable)
            {
                skippedSources.Add(source.Id);
                continue;
            }

            await foreach (var row in source.ReadAsync(from, to, cancellationToken).ConfigureAwait(false))
            {
                var identity = new PlaybackIdentity(source.Id, row.SourceRecordId);
                if (await repository.ContainsAsync(identity, cancellationToken).ConfigureAwait(false)) continue;

                await repository.AddAsync(new PlaybackRecord(
                    Guid.NewGuid(), row.SourceRecordId, row.UserId, row.ItemId, row.ItemName,
                    row.MediaKind, row.StartedAt, row.EndedAt, row.WatchedTicks,
                    row.PlaybackMethod, row.ClientName, row.DeviceName,
                    source.Id, row.SourceRecordId), cancellationToken).ConfigureAwait(false);
                imported++;
            }
        }

        return new ImportResult(imported, skippedSources);
    }
}

public sealed record ImportResult(int ImportedRecords, IReadOnlyList<string> SkippedSources);
