# CLAUDE.md – Finansiell Analyse

## Prosjektoversikt

Enkeltfil-webapplikasjon (ingen build-steg) for finansiell verdsettelse.
Tre filer av betydning: `index.html`, `styles.css`, `js/app.js`.

## Arkitektur

`app.js` er organisert i nummererte seksjoner:

1. **STORAGE** – `localStorage`-hjelpere, Oslo Børs-database (`OSLO_BORS_DB`), selskaps- og mappefunksjoner
2. **DCF CALCULATIONS** – `calcWACC`, `calcProjectionRows`, `calcDCF`, `calcSensitivity`
3. **MULTIPLES CALCULATIONS** – `peerMultiples`, `multipleStats`, `impliedVals`
4. **FORMATTERS** – `pf` (parseFloat), `fN` (kompakt tallformat), `fP` (prosent), `fmt` (valuta)
5. **STATE** – Globalt state-objekt (aktiv seksjon, valgt selskap, expandedFolders)
6. **RENDER** – All DOM-rendering; funksjoner starter med `render`
7. **EVENT HANDLING** – Delegert event-lytting fra `document`

Ingen rammeverk. Ingen moduler. Ingen bundler.

## Datamodell

### Selskap
```js
{
  id: string,          // crypto.randomUUID()
  name: string,
  ticker: string,      // alltid store bokstaver
  sector: string,      // ett av SECTORS-konstantene
  currency: string,    // ett av CURRENCIES-konstantene
  folderId: string|null,
  createdAt: number,
  updatedAt: number,
  dcf: DCFObject,
  multiples: MultiplesObject
}
```

### DCFObject – nøkkelfelter
- `historical` – 3 år med revenue/ebit/da/capex/nwcChange
- `assumptions` – arrays[10] for vekst, margin, D&A, capex, NWC per projeksjonår
- `wacc` – riskFreeRate, erp, beta, costOfDebt, taxRate, debtWeight, equityWeight
- `terminalValue` – method (`gordon`|`exit`), terminalGrowthRate, exitMultiple
- `bridge` – netDebt, minorities, otherAdjustments, sharesOutstanding, currentPrice

## Viktige konstanter

| Konstant | Beskrivelse |
|----------|-------------|
| `STORAGE_KEY` | `'finansiell-analyse-v1'` |
| `FOLDERS_KEY` | `'finansiell-analyse-folders-v1'` |
| `SECTORS` | 11 sektorer på norsk |
| `CURRENCIES` | NOK, USD, EUR, GBP, SEK, DKK |
| `OSLO_BORS_DB` | ~130 selskaper med name/ticker/sector |

## Konvensjoner

- Alle monetære input er i millioner (M) med mindre annet er angitt
- `pf(v)` brukes konsekvent for sikker `parseFloat` med fallback til 0
- `fN(v, d)` formatterer store tall til K/M/B/T
- Event-håndtering er delegert – ikke inline `onclick`
- Modal brukes for alle skjemaer (legg til selskap, legg til peer, mappe-navn)

## Endringer som krever ekstra forsiktighet

- **`calcDCF`** – Kjerneberegning; endre bare med bevisst testing av DCF-output
- **`OSLO_BORS_DB`** – Ikke dupliser tickers; sektor må være ett av `SECTORS`
- **`localStorage`-nøkler** – Endre disse vil miste eksisterende brukerdata
- **`defaultDCF` / `defaultMultiples`** – Brukes ved opprettelse av nye selskaper; strukturendringer må reflekteres i alle render-funksjoner
