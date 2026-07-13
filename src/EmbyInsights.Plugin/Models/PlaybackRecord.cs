namespace EmbyInsights.Models;

public sealed record PlaybackRecord(
    Guid Id,
    string SessionId,
    string UserId,
    string ItemId,
    string ItemName,
    MediaKind MediaKind,
    DateTimeOffset StartedAt,
    DateTimeOffset EndedAt,
    long WatchedTicks,
    PlaybackMethod PlaybackMethod,
    string? ClientName = null,
    string? DeviceName = null,
    string SourceId = "native",
    string? SourceRecordId = null);

public sealed record PlaybackIdentity(string SourceId, string SourceRecordId);

public enum MediaKind { Unknown, Movie, Episode, Audio, Other }
public enum PlaybackMethod { Unknown, DirectPlay, DirectStream, Transcode }
