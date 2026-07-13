# Emby Insights – Produktivinstallation

Dieses Paket ist für einen Emby-Server in einem Docker-Container vorgesehen. Es installiert das Server-Plugin und die Browser-Erweiterung für den dritten Startseiten-Tab.

## Voraussetzungen

- SSH-Zugriff auf den Server
- Docker-Container mit Emby
- installiertes Playback Reporting als Datenquelle
- Administratorzugang in Emby
- Schreibzugriff auf Embys Plugin-Verzeichnis

## Sichere Vorschau

Der Installer verändert ohne `--apply` nichts:

```bash
./scripts/install-remote.sh \
  --host DEIN_SERVER \
  --plugin-dir /pfad/zu/emby/plugins \
  --container emby
```

## Installation

Wenn Host, Plugin-Pfad und Containername in der Vorschau stimmen:

```bash
./scripts/install-remote.sh \
  --host DEIN_SERVER \
  --plugin-dir /pfad/zu/emby/plugins \
  --container emby \
  --apply
```

Der Installer:

1. überträgt alle Dateien zunächst in ein temporäres Verzeichnis,
2. verifiziert die Größe der DLL,
3. erstellt eine datierte Sicherung einer vorhandenen Plugin-DLL,
4. installiert Plugin und Webclient-Dateien,
5. ergänzt die Script-Tags idempotent,
6. startet ausschließlich den angegebenen Emby-Container neu.

Nach einem Emby-Container-Update muss die Webclient-Erweiterung erneut installiert werden, weil das Container-Image `dashboard-ui` ersetzt. Die Plugin-DLL und ihre Konfiguration bleiben im persistenten Plugin-Verzeichnis erhalten.

## Dateien

- `EmbyInsights.Plugin.dll` – Server-Plugin mit eingebettetem Katalogbild
- `web/statistics.html` – Dashboard-Ansicht
- `web/statistics.js` – Dashboard-Logik
- `web/statistics-tab.global.js` – Startseiten-Tab und Route
- `scripts/install-remote.sh` – sicherer Remote-Installer
