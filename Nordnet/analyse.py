import pandas as pd
import sys
import os
import glob
import re
import json
import webbrowser
import tempfile
from datetime import date

GREEN = "\033[32m"
RED   = "\033[31m"
BOLD  = "\033[1m"
RESET = "\033[0m"

CHART_COLORS = [
    "#4361ee", "#f72585", "#4cc9f0", "#7209b7",
    "#f77f00", "#4caf50", "#e91e63", "#00bcd4",
    "#ff5722", "#9c27b0",
]


def colorize(value, text):
    if value > 0:
        return f"{GREEN}{text}{RESET}"
    if value < 0:
        return f"{RED}{text}{RESET}"
    return text


def parse_norwegian_number(value):
    if pd.isna(value):
        return float("nan")
    return float(str(value).replace("\xa0", "").replace(" ", "").replace(",", "."))


def load_portfolio(filepath):
    df = pd.read_csv(filepath, encoding="utf-16", sep="\t")
    numeric_cols = ["Antall", "GAV", "Siste kurs", "Verdi NOK", "Avkast. %", "Avkast.\xa0NOK"]
    for col in numeric_cols:
        df[col] = df[col].apply(parse_norwegian_number)
    return df


def account_label(filepath):
    match = re.search(r"konto-(\d+)", os.path.basename(filepath))
    return match.group(1) if match else os.path.basename(filepath)


def print_table(df):
    col_name     = "Aksje"
    col_shares   = "Antall"
    col_avg      = "Snitt-kurs"
    col_currency = "Valuta"
    col_value    = "Verdi (NOK)"
    col_alloc    = "Andel"
    col_pnl_nok  = "P&L (NOK)"
    col_pnl_pct  = "P&L (%)"

    total_value = df["Verdi NOK"].sum()

    rows = []
    for _, row in df.iterrows():
        rows.append({
            col_name:     row["Navn"],
            col_currency: row["Valuta"],
            col_shares:   int(row["Antall"]),
            col_avg:      row["GAV"],
            col_value:    row["Verdi NOK"],
            col_alloc:    row["Verdi NOK"] / total_value * 100,
            col_pnl_nok:  row["Avkast.\xa0NOK"],
            col_pnl_pct:  row["Avkast. %"],
        })

    name_w   = max(len(col_name),    max(len(r[col_name])     for r in rows))
    cur_w    = max(len(col_currency), max(len(r[col_currency]) for r in rows))
    shares_w = max(len(col_shares),   max(len(str(r[col_shares])) for r in rows))
    avg_w    = max(len(col_avg),      max(len(f"{r[col_avg]:.2f}") for r in rows))
    val_w    = max(len(col_value),    max(len(f"{r[col_value]:,.0f}") for r in rows))
    alloc_w  = max(len(col_alloc),    max(len(f"{r[col_alloc]:.1f}%") for r in rows))
    pnl_w    = max(len(col_pnl_nok),  max(len(f"{r[col_pnl_nok]:,.0f}") for r in rows))
    pct_w    = max(len(col_pnl_pct),  max(len(f"{r[col_pnl_pct]:.2f}%") for r in rows))

    sep = (
        f"+-{'-'*name_w}-+-{'-'*cur_w}-+-{'-'*shares_w}-+-{'-'*avg_w}-+"
        f"-{'-'*val_w}-+-{'-'*alloc_w}-+-{'-'*pnl_w}-+-{'-'*pct_w}-+"
    )
    header = (
        f"| {col_name:<{name_w}} | {col_currency:<{cur_w}} | {col_shares:>{shares_w}} "
        f"| {col_avg:>{avg_w}} | {col_value:>{val_w}} | {col_alloc:>{alloc_w}} "
        f"| {col_pnl_nok:>{pnl_w}} | {col_pnl_pct:>{pct_w}} |"
    )

    print(sep)
    print(header)
    print(sep)

    for r in rows:
        pnl_nok = r[col_pnl_nok]
        pnl_pct = r[col_pnl_pct]
        sign_nok = "+" if pnl_nok >= 0 else ""
        sign_pct = "+" if pnl_pct >= 0 else ""

        alloc_str  = f"{r[col_alloc]:.1f}%".rjust(alloc_w)
        pnl_nok_str = colorize(pnl_nok, f"{sign_nok}{pnl_nok:,.0f}".rjust(pnl_w))
        pnl_pct_str = colorize(pnl_pct, f"{sign_pct}{pnl_pct:.2f}%".rjust(pct_w))

        print(
            f"| {r[col_name]:<{name_w}} | {r[col_currency]:<{cur_w}} "
            f"| {r[col_shares]:>{shares_w}} | {r[col_avg]:>{avg_w}.2f} "
            f"| {r[col_value]:>{val_w},.0f} | {alloc_str} | {pnl_nok_str} | {pnl_pct_str} |"
        )

    print(sep)

    account_value = df["Verdi NOK"].sum()
    account_pnl   = df["Avkast.\xa0NOK"].sum()
    account_pct   = (account_pnl / (account_value - account_pnl)) * 100

    sign = "+" if account_pnl >= 0 else ""
    pnl_str = colorize(account_pnl, f"{sign}{account_pnl:,.0f}".rjust(12))
    pct_str = colorize(account_pct, f"{sign}{account_pct:.2f}%")
    print(f"\n{'Verdi':>20}: {account_value:>12,.0f} NOK")
    print(f"{'P&L':>20}: {pnl_str} NOK  ({pct_str})")

    return account_value, account_pnl


def build_account_data(label, df):
    total_value = df["Verdi NOK"].sum()
    stocks = []
    for _, row in df.iterrows():
        stocks.append({
            "name":      row["Navn"],
            "currency":  row["Valuta"],
            "shares":    int(row["Antall"]),
            "avg_price": round(row["GAV"], 2),
            "value_nok": round(row["Verdi NOK"], 0),
            "alloc_pct": round(row["Verdi NOK"] / total_value * 100, 1),
            "pnl_nok":   round(row["Avkast.\xa0NOK"], 0),
            "pnl_pct":   round(row["Avkast. %"], 2),
        })
    total_value = round(df["Verdi NOK"].sum(), 0)
    total_pnl   = round(df["Avkast.\xa0NOK"].sum(), 0)
    total_pct   = round((total_pnl / (total_value - total_pnl)) * 100, 2)
    return {
        "label":       label,
        "stocks":      stocks,
        "total_value": total_value,
        "total_pnl":   total_pnl,
        "total_pct":   total_pct,
    }


def generate_html(accounts):
    today = date.today().strftime("%-d. %B %Y").replace(
        "January","januar").replace("February","februar").replace("March","mars"
        ).replace("April","april").replace("May","mai").replace("June","juni"
        ).replace("July","juli").replace("August","august").replace("September","september"
        ).replace("October","oktober").replace("November","november").replace("December","desember")

    total_value = sum(a["total_value"] for a in accounts)
    total_pnl   = sum(a["total_pnl"]   for a in accounts)
    total_pct   = round((total_pnl / (total_value - total_pnl)) * 100, 2) if total_value != total_pnl else 0

    data_json = json.dumps({"accounts": accounts, "colors": CHART_COLORS}, ensure_ascii=False)

    pnl_color    = "#16a34a" if total_pnl >= 0 else "#dc2626"
    pnl_sign     = "+" if total_pnl >= 0 else ""
    pnl_pct_sign = "+" if total_pct >= 0 else ""

    multi_account_section = ""
    if len(accounts) > 1:
        account_cards = ""
        for acc in accounts:
            c = "#16a34a" if acc["total_pnl"] >= 0 else "#dc2626"
            s = "+" if acc["total_pnl"] >= 0 else ""
            sp = "+" if acc["total_pct"] >= 0 else ""
            account_cards += f"""
            <div class="account-card">
                <div class="account-title">Konto {acc["label"]}</div>
                <div class="account-value">{acc["total_value"]:,.0f} NOK</div>
                <div class="account-pnl" style="color:{c}">{s}{acc["total_pnl"]:,.0f} NOK ({sp}{acc["total_pct"]}%)</div>
            </div>"""
        multi_account_section = f"""
        <section>
            <h2>Per konto</h2>
            <div class="account-cards">{account_cards}</div>
        </section>"""

    html = f"""<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Porteføljeanalyse</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         background: #f8fafc; color: #1e293b; min-height: 100vh; }}
  header {{ background: #1e293b; color: #f8fafc; padding: 1.5rem 2rem;
            display: flex; justify-content: space-between; align-items: center; }}
  header h1 {{ font-size: 1.4rem; font-weight: 600; letter-spacing: -0.02em; }}
  header span {{ font-size: 0.85rem; opacity: 0.6; }}
  main {{ max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 2rem; }}
  section {{ background: white; border-radius: 12px; padding: 1.5rem;
             box-shadow: 0 1px 3px rgba(0,0,0,.07); }}
  h2 {{ font-size: 1rem; font-weight: 600; color: #64748b;
        text-transform: uppercase; letter-spacing: .05em; margin-bottom: 1.2rem; }}

  .summary-cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }}
  .card {{ background: white; border-radius: 12px; padding: 1.2rem 1.5rem;
           box-shadow: 0 1px 3px rgba(0,0,0,.07); }}
  .card-label {{ font-size: .75rem; font-weight: 600; color: #94a3b8;
                 text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; }}
  .card-value {{ font-size: 1.6rem; font-weight: 700; letter-spacing: -.03em; }}
  .card-sub {{ font-size: .85rem; color: #64748b; margin-top: .2rem; }}

  .charts-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }}
  @media (max-width: 700px) {{ .charts-grid {{ grid-template-columns: 1fr; }} }}
  .chart-box {{ background: white; border-radius: 12px; padding: 1.5rem;
                box-shadow: 0 1px 3px rgba(0,0,0,.07); }}
  .chart-box h2 {{ margin-bottom: 1rem; }}
  .chart-wrapper {{ position: relative; height: 280px; }}

  table {{ width: 100%; border-collapse: collapse; font-size: .9rem; }}
  thead tr {{ border-bottom: 2px solid #e2e8f0; }}
  th {{ padding: .6rem .8rem; text-align: right; font-size: .75rem; font-weight: 600;
        color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }}
  th:first-child {{ text-align: left; }}
  td {{ padding: .65rem .8rem; text-align: right; border-bottom: 1px solid #f1f5f9; }}
  td:first-child {{ text-align: left; font-weight: 500; }}
  tr:last-child td {{ border-bottom: none; }}
  tr:hover td {{ background: #f8fafc; }}
  .pos {{ color: #16a34a; font-weight: 600; }}
  .neg {{ color: #dc2626; font-weight: 600; }}

  .account-cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }}
  .account-card {{ background: #f8fafc; border-radius: 10px; padding: 1.1rem 1.3rem; border: 1px solid #e2e8f0; }}
  .account-title {{ font-size: .75rem; font-weight: 600; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; }}
  .account-value {{ font-size: 1.2rem; font-weight: 700; }}
  .account-pnl {{ font-size: .85rem; font-weight: 600; margin-top: .2rem; }}
</style>
</head>
<body>
<header>
  <h1>Porteføljeanalyse</h1>
  <span>{today}</span>
</header>
<main>

  <div class="summary-cards">
    <div class="card">
      <div class="card-label">Total verdi</div>
      <div class="card-value">{total_value:,.0f}</div>
      <div class="card-sub">NOK</div>
    </div>
    <div class="card">
      <div class="card-label">Total P&amp;L</div>
      <div class="card-value" style="color:{pnl_color}">{pnl_sign}{total_pnl:,.0f}</div>
      <div class="card-sub" style="color:{pnl_color}">{pnl_pct_sign}{total_pct:.2f}%</div>
    </div>
    <div class="card">
      <div class="card-label">Kontoer</div>
      <div class="card-value">{len(accounts)}</div>
    </div>
    <div class="card">
      <div class="card-label">Aksjer</div>
      <div class="card-value">{sum(len(a["stocks"]) for a in accounts)}</div>
    </div>
  </div>

  <div class="charts-grid">
    <div class="chart-box">
      <h2>Fordeling</h2>
      <div class="chart-wrapper"><canvas id="pieChart"></canvas></div>
    </div>
    <div class="chart-box">
      <h2>P&amp;L per aksje (NOK)</h2>
      <div class="chart-wrapper"><canvas id="barChart"></canvas></div>
    </div>
  </div>

  {multi_account_section}

  <section>
    <h2>Beholdning</h2>
    <table>
      <thead>
        <tr>
          <th>Aksje</th>
          <th>Valuta</th>
          <th>Antall</th>
          <th>Snitt-kurs</th>
          <th>Verdi (NOK)</th>
          <th>Andel</th>
          <th>P&amp;L (NOK)</th>
          <th>P&amp;L (%)</th>
        </tr>
      </thead>
      <tbody id="stockTable"></tbody>
    </table>
  </section>

</main>

<script>
const DATA = {data_json};
const colors = DATA.colors;
const accounts = DATA.accounts;

const allStocks = accounts.flatMap(a => a.stocks);

// Pie chart — allocation
const pieCtx = document.getElementById("pieChart").getContext("2d");
new Chart(pieCtx, {{
  type: "doughnut",
  data: {{
    labels: allStocks.map(s => s.name),
    datasets: [{{
      data: allStocks.map(s => s.value_nok),
      backgroundColor: colors.slice(0, allStocks.length),
      borderWidth: 2,
      borderColor: "#fff",
    }}]
  }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {{
      legend: {{ position: "right", labels: {{ boxWidth: 12, font: {{ size: 12 }} }} }},
      tooltip: {{
        callbacks: {{
          label: ctx => ` ${{ctx.label}}: ${{ctx.parsed.toLocaleString("nb-NO")}} NOK`
        }}
      }}
    }}
  }}
}});

// Bar chart — P&L
const sorted = [...allStocks].sort((a, b) => b.pnl_nok - a.pnl_nok);
const barCtx = document.getElementById("barChart").getContext("2d");
new Chart(barCtx, {{
  type: "bar",
  data: {{
    labels: sorted.map(s => s.name),
    datasets: [{{
      label: "P&L (NOK)",
      data: sorted.map(s => s.pnl_nok),
      backgroundColor: sorted.map(s => s.pnl_nok >= 0 ? "#16a34a" : "#dc2626"),
      borderRadius: 4,
    }}]
  }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {{ legend: {{ display: false }} }},
    scales: {{
      x: {{ grid: {{ display: false }} }},
      y: {{
        grid: {{ color: "#f1f5f9" }},
        ticks: {{ callback: v => v.toLocaleString("nb-NO") }}
      }}
    }}
  }}
}});

// Table
const tbody = document.getElementById("stockTable");
allStocks.forEach(s => {{
  const posNok = s.pnl_nok >= 0;
  const posPct = s.pnl_pct >= 0;
  const sign = v => v >= 0 ? "+" : "";
  tbody.innerHTML += `
    <tr>
      <td>${{s.name}}</td>
      <td>${{s.currency}}</td>
      <td>${{s.shares}}</td>
      <td>${{s.avg_price.toLocaleString("nb-NO", {{minimumFractionDigits:2}})}}</td>
      <td>${{s.value_nok.toLocaleString("nb-NO")}}</td>
      <td>${{s.alloc_pct.toFixed(1)}}%</td>
      <td class="${{posNok ? "pos" : "neg"}}">${{sign(s.pnl_nok)}}${{s.pnl_nok.toLocaleString("nb-NO")}}</td>
      <td class="${{posPct ? "pos" : "neg"}}">${{sign(s.pnl_pct)}}${{s.pnl_pct.toFixed(2)}}%</td>
    </tr>`;
}});
</script>
</body>
</html>"""
    return html


def find_csv_files(script_dir):
    return sorted(glob.glob(os.path.join(script_dir, "aksjelister_konto-*.csv")))


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    if len(sys.argv) > 1:
        filepaths = sys.argv[1:]
    else:
        filepaths = find_csv_files(script_dir)

    if not filepaths:
        print("Ingen CSV-filer funnet. Legg aksjelister_konto-*.csv i samme mappe, eller oppgi filstier som argumenter.")
        sys.exit(1)

    accounts = []
    totals = []

    for filepath in filepaths:
        if not os.path.exists(filepath):
            print(f"Finner ikke filen: {filepath}")
            continue

        df = load_portfolio(filepath)
        label = account_label(filepath)

        print(f"\n{BOLD}Konto {label}{RESET} — {len(df)} aksjer\n")
        value, pnl = print_table(df)
        totals.append((label, value, pnl))
        accounts.append(build_account_data(label, df))

    if len(totals) > 1:
        total_value = sum(v for _, v, _ in totals)
        total_pnl   = sum(p for _, _, p in totals)
        total_pct   = round((total_pnl / (total_value - total_pnl)) * 100, 2)
        sign = "+" if total_pnl >= 0 else ""
        pnl_str = colorize(total_pnl, f"{sign}{total_pnl:,.0f}".rjust(12))
        pct_str = colorize(total_pct, f"{sign}{total_pct:.2f}%")
        print(f"\n{BOLD}{'— Totalt alle kontoer —':^40}{RESET}")
        print(f"{'Totalverdi':>20}: {total_value:>12,.0f} NOK")
        print(f"{'Total P&L':>20}: {pnl_str} NOK  ({pct_str})")

    print()

    html_path = os.path.join(script_dir, "rapport.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(generate_html(accounts))

    webbrowser.open(f"file://{html_path}")
    print(f"Rapport åpnet i nettleseren → {html_path}\n")


if __name__ == "__main__":
    main()
