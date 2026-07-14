namespace EmbyInsights.ServerEntryPoints;

public sealed class WebClientInstallationStatus
{
    public bool Installed { get; init; }
    public bool HostRepairRequired { get; init; }
    public string AssetDirectory { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
}

public static class WebClientInstallationState
{
    public static WebClientInstallationStatus Current { get; private set; } = new()
    {
        Detail = "The web client installer has not run yet."
    };

    public static void Update(WebClientInstallationStatus status) => Current = status;
}
