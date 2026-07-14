# Emby Insights Roadmap

## Eigene Wiedergabedatenbank

Emby Insights liest Wiedergabedaten derzeit ausschließlich und direkt aus der von
Playback Reporting verwalteten Datenbank. Es wird keine eigene Kopie angelegt und
ohne installiertes Playback Reporting stehen aktuell keine Wiedergabedaten bereit.

Als zukünftiges Feature ist eine eigene Datenbank geplant:

- vorhandene Wiedergaben einmalig aus Playback Reporting importieren,
- neue Wiedergaben anschließend nativ über Emby erfassen,
- ohne Playback Reporting direkt mit einer leeren eigenen Datenbank starten,
- Import und native Erfassung deduplizieren,
- Aufbewahrung und Mindestwiedergabedauer tatsächlich anwenden,
- eine sichere Migration für bestehende Installationen bereitstellen.

Bis diese Verdrahtung implementiert und getestet ist, bleiben die vorhandenen
Repository-, Import- und Tracking-Klassen internes Code-Gerüst und keine aktive
Plugin-Funktion.

## Performance

- Den Library-Lookup-Cache über mehrere Statistik-Requests hinweg wiederverwenden
  oder durch eine geeignete Bulk-Auflösung ersetzen. Aktuell verhindert ein
  Request-lokaler Cache doppelte Lookups innerhalb eines Requests; beim Laden
  mehrerer Dashboard-Endpunkte können dieselben Item-IDs erneut aufgelöst werden.
