namespace EmbyInsights.Plugin;

/// <summary>
/// Boundary for the real Emby plugin entry point.
/// </summary>
/// <remarks>
/// Follow-up integration boundary for registering playback listeners and API
/// services. The concrete plugin entry point is <see cref="Plugin"/>; volatile
/// Emby event and HTTP contracts remain isolated behind adapters.
/// </remarks>
public sealed class EmbyPluginAdapter
{
    public string Name => PluginInfo.Name;
    public Guid Id => PluginInfo.Id;
}
