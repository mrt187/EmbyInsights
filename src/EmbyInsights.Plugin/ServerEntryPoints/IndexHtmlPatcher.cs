using System.Text.RegularExpressions;

namespace EmbyInsights.ServerEntryPoints;

/// <summary>
/// Pure string logic for the index.html script-tag patch, kept free of Emby SDK types so it
/// can be unit tested without loading the MediaBrowser assemblies.
/// </summary>
internal static class IndexHtmlPatcher
{
    public static string UpsertScriptTag(string html, string scriptPath, string version)
    {
        var tag = $"{scriptPath}?v={version}";
        var existing = new Regex(Regex.Escape(scriptPath) + @"(\?v=[^""']*)?");
        if (existing.IsMatch(html))
        {
            return existing.Replace(html, tag);
        }

        return html.Replace("</body>", $"    <script src=\"{tag}\"></script>\n</body>");
    }
}
