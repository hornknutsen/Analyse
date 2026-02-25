# Finansiell Analyse

Et verktøy for verdsettelse og finansiell analyse av børsnoterte selskaper, med fokus på Oslo Børs.

## Funksjoner

- **DCF-analyse** – Diskontert kontantstrøm-modell med fullt utfylte projeksjonrader, WACC-kalkulator, terminal value (Gordon-modell eller exit-multippel), og bro fra EV til egenkapitalverdi per aksje
- **Sensitivitetsanalyse** – 5×5-matrise som viser aksjekurs over en rekke WACC- og terminalvekst-kombinasjoner
- **Multiplanalyse** – EV/Revenue, EV/EBITDA, EV/EBIT og P/E sammenlignet med inntastede peer-selskaper; viser P25/median/gjennomsnitt/P75
- **Selskapsdatabase** – Innebygd register med ~130 selskaper fra Oslo Børs fordelt på sektor (Energi, Finans, Teknologi, Sjømat, Shipping m.fl.)
- **Mapper** – Organiser selskaper i egendefinerte mapper i sidefeltet
- **Lokal lagring** – All data lagres i nettleserens `localStorage`; ingen server nødvendig

## Teknisk stack

| Lag | Teknologi |
|-----|-----------|
| Markup | HTML5 |
| Stil | Vanilla CSS (`styles.css`) |
| Logikk | Vanilla JavaScript ES2020 (`js/app.js`) |
| Lagring | `localStorage` |

Ingen byggeverktøy, ingen avhengigheter, ingen pakkehåndterer – åpne `index.html` direkte i nettleseren.

## Kom i gang

```bash
# Klon eller last ned repoet
open index.html   # macOS
# eller dobbeltklikk på index.html i Finder / Utforsker
```

## Filstruktur

```
finansiell-analyse/
├── index.html      # App-skall og sidebar-struktur
├── styles.css      # All CSS (~24 KB)
└── js/
    └── app.js      # All applikasjonslogikk (~65 KB)
```

## Datapersistens

Alle selskaper, mapper og analysedata lagres i nettleserens `localStorage` under nøklene:

- `finansiell-analyse-v1` – selskapsobjekter med DCF- og multippeldata
- `finansiell-analyse-folders-v1` – mappestruktur

Data slettes dersom nettleserens lagring tømmes. Eksporter data manuelt ved behov.
