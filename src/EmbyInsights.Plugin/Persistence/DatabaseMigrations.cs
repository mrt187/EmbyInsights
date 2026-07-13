namespace EmbyInsights.Persistence;

public sealed record DatabaseMigration(int Version, string Description, string Sql);

public static class DatabaseMigrations
{
    public static IReadOnlyList<DatabaseMigration> All { get; } =
    [
        new(1, "Initial playback schema", """
            CREATE TABLE IF NOT EXISTS SchemaVersion (
                Version INTEGER NOT NULL PRIMARY KEY,
                AppliedAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS PlaybackRecords (
                Id TEXT NOT NULL PRIMARY KEY,
                SessionId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                ItemId TEXT NOT NULL,
                ItemName TEXT NOT NULL,
                MediaKind INTEGER NOT NULL,
                StartedAt TEXT NOT NULL,
                EndedAt TEXT NOT NULL,
                WatchedTicks INTEGER NOT NULL,
                PlaybackMethod INTEGER NOT NULL,
                ClientName TEXT NULL,
                DeviceName TEXT NULL,
                SourceId TEXT NOT NULL,
                SourceRecordId TEXT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS UX_PlaybackRecords_Source
                ON PlaybackRecords(SourceId, SourceRecordId)
                WHERE SourceRecordId IS NOT NULL;
            CREATE INDEX IF NOT EXISTS IX_PlaybackRecords_StartedAt
                ON PlaybackRecords(StartedAt);
            CREATE INDEX IF NOT EXISTS IX_PlaybackRecords_User_StartedAt
                ON PlaybackRecords(UserId, StartedAt);
            """)
    ];
}
