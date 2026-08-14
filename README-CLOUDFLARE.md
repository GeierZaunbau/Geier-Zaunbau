# Geier Grund & Grenze — Statische Website für Cloudflare

Diese Version ist reines HTML/CSS/JS — kein WordPress, kein PHP, kein Build-Prozess. Passt direkt zu Cloudflare Pages.

## 1. Bei Cloudflare deployen

**Einfachster Weg (Drag & Drop, kein wrangler nötig):**
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. Den kompletten Ordnerinhalt (alle Dateien aus diesem Zip) per Drag & Drop hochladen
3. Projektnamen vergeben → Deploy

Das ist eine reine Datei-Sammlung ohne `package.json` und ohne Build-Schritt — der Fehler von vorhin ("Uploader unterstützt keine Projekte mit Build-Prozess") tritt hier nicht mehr auf, weil kein Build nötig ist.

**Alternative (falls du wrangler bevorzugst):**
```
npm install -g wrangler
wrangler pages deploy .
```
im entpackten Projektordner ausführen.

## 2. Kontaktformular aktivieren (Formspree, kostenlos)

Da eine statische Website keine eigene Serverlogik hat, läuft das Formular über den kostenlosen Dienst **Formspree**:

1. Auf https://formspree.io kostenlos registrieren
2. Neues Formular anlegen, deine E-Mail-Adresse hinterlegen
3. Formspree zeigt dir eine URL wie `https://formspree.io/f/abc123xyz`
4. In `index.html` suchen nach `FORMSPREE_URL_HIER` und durch diese URL ersetzen (kommt einmal vor, im `<form action="...">`)
5. Datei erneut bei Cloudflare hochladen (oder erneut `wrangler pages deploy .`)

Ab dann landen alle Formularanfragen direkt in deinem Postfach.

## 3. Eigene Daten eintragen

Anders als bei WordPress gibt es hier keine zentrale Konfigurationsdatei — die Kontaktdaten stehen direkt im HTML. Öffne `index.html` in einem Texteditor und ersetze per Suchen-und-Ersetzen:

| Platzhalter | Ersetzen durch |
|---|---|
| `+4917600000000` (in `tel:`-Links) | deine echte Telefonnummer, Format `+49...` ohne Leerzeichen |
| `0176 00000000` (sichtbarer Text) | deine Telefonnummer in Lesefreundlichem Format |
| `4917600000000` (in `wa.me`-Links) | deine WhatsApp-Nummer ohne `+` und ohne Leerzeichen |
| `info@geier-grund-grenze.de` | deine echte E-Mail-Adresse |
| `Musterstraße 1, 55765 Birkenfeld` | deine echte Adresse |

Diese Platzhalter kommen mehrfach im Dokument vor (Header, Hero, Kontaktbereich, Footer) — am besten den Editor "Suchen & Ersetzen alle" nutzen.

## 4. Eigene Domain verbinden

Im Cloudflare-Projekt unter **Custom domains** kannst du deine eigene Domain (z. B. geier-grund-grenze.de) hinterlegen. Falls die Domain noch nicht bei Cloudflare liegt, kannst du sie dort auch direkt registrieren oder von deinem bisherigen Anbieter übertragen (DNS-Einträge anpassen).

## 5. Rechtliches — bitte vor Livegang prüfen

- **impressum.html**: Pflichtangaben nach § 5 TMG vollständig ausfüllen
- **datenschutz.html**: Muss Formspree, Google Fonts und den WhatsApp-Link (Datenübertragung an Meta/WhatsApp Ireland) abdecken. Empfehlung: Datenschutz-Generator (z. B. e-recht24.de) oder anwaltliche Beratung.

## Dateistruktur

```
geier-grund-grenze-static/
├── index.html            → Startseite (komplette One-Page-Website)
├── impressum.html        → Platzhalter-Impressum
├── datenschutz.html      → Platzhalter-Datenschutz
└── assets/
    ├── css/main.css      → Gesamtes Design
    └── js/main.js        → Mobiles Menü, Scroll-Verhalten
```
