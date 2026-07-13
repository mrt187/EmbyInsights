# Emby Insights

Emby Insights ist das Grundgerüst für ein modernes, nur für Administratoren sichtbares Playback-Statistik-Plugin. Der geplante Browser-Tab sitzt neben „Start“ und „Favoriten“; API und Oberfläche prüfen Admin-Zugriff unabhängig voneinander.

## Status

Das Repository ist bewusst ein **SDK-neutrales, kompilierbares Grundgerüst**. Fachmodelle, Tracking, Aggregationen, Repository-Abstraktion und ein In-Memory-Adapter sind vorhanden. Emby- und SQLite-spezifische Bindings sind als `TODO(Emby SDK)` bzw. `TODO(SQLite)` markiert, bis eine konkrete Emby-Server-/SDK-Version feststeht.

## Struktur

```text
EmbyInsights/
├── EmbyInsights.sln
└── src/EmbyInsights.Plugin/
    ├── Plugin/              Plugin-Metadaten und Emby-Adaptergrenze
    ├── Configuration/       Plugin-Einstellungen und Emby-Settings-Seite
    ├── Playback/            Framework-neutrales Session-Tracking
    ├── DataSources/         Optionale Playback-Reporting-/Statistics-Provider
    ├── Services/            Statistik-Aggregationen
    ├── Persistence/         Repository, In-Memory- und SQLite-Adapter
    ├── Api/                 Admin-geschützte Handler und HTTP-Adaptergrenze
    ├── Models/              Domain- und API-Modelle
    └── WebClientExtension/  HTML, CSS, JavaScript und Tab-Injection
```

Der Datenfluss ist: Emby-Eventadapter oder externer Provider → Import/`PlaybackTracker` → eigenes `IPlaybackRepository` → `StatisticsService` → admin-geschützte API → WebClientExtension. Fremde Datenquellen werden ausschließlich gelesen und in das normalisierte eigene Schema importiert. Emby-Verträge bleiben in den Adapterklassen, sodass ein SDK-Update nicht die Domänenschicht durchzieht.

## Build

Voraussetzung für das neutrale Grundgerüst ist .NET 8 SDK oder neuer:

```bash
dotnet restore EmbyInsights.sln
dotnet build EmbyInsights.sln --configuration Release
dotnet run --project tests/EmbyInsights.Tests --configuration Release
```

Die Assembly liegt danach unter `src/EmbyInsights.Plugin/bin/Release/net8.0/`. Die Webressourcen werden in den Build-Output kopiert.

## Installation (nach SDK-Anbindung)

1. Die genaue Emby-Serverversion feststellen und das dazu passende offizielle Plugin-SDK/Assembly-Set referenzieren.
2. `EmbyPluginAdapter`, `EmbyPlaybackEventAdapter` und `EmbyApiAdapter` mit den verifizierten Verträgen implementieren.
3. Das Target Framework auf das vom Zielserver unterstützte Framework setzen.
4. Release bauen und die Plugin-DLL plus erforderliche Ressourcen/Abhängigkeiten in Emby's Plugin-Verzeichnis kopieren.
5. Emby Server neu starten und Logs auf Ladefehler prüfen.
6. Den Webclient-Patch nur für die bestätigte Webclient-Version aktivieren; Dateipfade und Cache-Verhalten unterscheiden sich je Installation.

> Es werden absichtlich keine Paketnamen, Basisklassen, Eventnamen oder Installationspfade behauptet, solange die konkrete Emby-Version nicht festgelegt ist.

## Sicherheit

Das Ausblenden des Tabs ist keine Zugriffskontrolle. Der spätere Emby-HTTP-Adapter muss die Identität und `IsAdministrator` serverseitig aus Emby's authentifiziertem Request ableiten. Client-Parameter dürfen dafür nie maßgeblich sein.

## UI-Konvention für Emby-Plugins

- Aufklappbare Bereiche einer Settings-Seite sind beim Öffnen standardmäßig geschlossen.
- Oben rechts stehen einheitlich die drei Schaltflächen **Readme**, **Logs** und **Info**.
- Die zugehörigen API-Endpunkte sind admin-geschützt; Logs werden nur lesend angezeigt.
- Browser-Hauptnavigationserweiterungen prüfen die Administratorrolle und Plugin-Konfiguration
  clientseitig; sämtliche Datenendpunkte bleiben zusätzlich serverseitig admin-geschützt.

## TODO

- [ ] Zielversion von Emby Server und kompatibles Target Framework festlegen
- [ ] Offizielle SDK-Referenzen pinnen und Plugin-Einstiegspunkt implementieren
- [ ] Playback-Start/-Stop/-Progress-Events verifiziert anbinden
- [x] Provider-Abstraktion und deduplizierender Import-Service anlegen
- [x] SQLite-Schema, Repository-Logik und versionierte Migrationen implementieren
- [ ] Mit der Emby-Zielversion kompatiblen SQLite-Connection-Provider auswählen
- [ ] Installierte Playback-Reporting-Version prüfen und Read-only-Adapter implementieren
- [ ] Installierte Statistics-Version prüfen und verwertbare Daten bestimmen
- [ ] REST-Routen inklusive serverseitiger Admin-Autorisierung registrieren
- [ ] Zeitraumparser (`7d`, `30d`, `year`, `all`) und Zeitzonenregeln definieren
- [ ] Benutzer-, Medien-, Geräte- und Qualitätsendpunkte ergänzen
- [ ] Webclient-Route und Ressourcenregistrierung für eine konkrete Version implementieren
- [ ] Tab-Injection gegen die Zielversion testen und Update-Fehler tolerant behandeln
- [ ] Diagrammbibliothek auswählen oder leichte SVG/Canvas-Charts implementieren
- [ ] Unit-, Integrations- und Migrationstests ergänzen
- [ ] Aufbewahrung, Datenschutz, Export und Datenbereinigung umsetzen
