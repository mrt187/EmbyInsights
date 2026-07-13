using System.Collections.Concurrent;
using EmbyInsights.Models;
using EmbyInsights.Persistence;

namespace EmbyInsights.Playback;

public sealed class PlaybackTracker(IPlaybackRepository repository)
{
    private readonly ConcurrentDictionary<string, PlaybackStarted> _sessions = new();

    public void OnStarted(PlaybackStarted playback) => _sessions[playback.SessionId] = playback;

    public async Task OnStoppedAsync(PlaybackStopped playback, CancellationToken cancellationToken = default)
    {
        if (!_sessions.TryRemove(playback.SessionId, out var started)) return;

        var record = new PlaybackRecord(
            Guid.NewGuid(), started.SessionId, started.UserId, started.ItemId, started.ItemName,
            started.MediaKind, started.StartedAt, playback.EndedAt, playback.WatchedTicks,
            playback.PlaybackMethod, started.ClientName, started.DeviceName);

        await repository.AddAsync(record, cancellationToken).ConfigureAwait(false);
    }
}

public sealed record PlaybackStarted(
    string SessionId, string UserId, string ItemId, string ItemName, MediaKind MediaKind,
    DateTimeOffset StartedAt, string? ClientName = null, string? DeviceName = null);

public sealed record PlaybackStopped(
    string SessionId, DateTimeOffset EndedAt, long WatchedTicks, PlaybackMethod PlaybackMethod);
