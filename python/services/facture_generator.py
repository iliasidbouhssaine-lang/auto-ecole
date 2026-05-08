import base64
import json
import os
import threading
from datetime import date
from weasyprint import HTML

TVA_FIXE = 350.0
_LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "logo.jpeg")
_COUNTER_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "facture_counter.json")
_counter_lock = threading.Lock()


def _next_invoice_number() -> str:
    year = date.today().year
    os.makedirs(os.path.dirname(_COUNTER_PATH), exist_ok=True)
    with _counter_lock:
        try:
            with open(_COUNTER_PATH, "r") as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = {"year": year, "seq": 0}

        if data.get("year") != year:
            data = {"year": year, "seq": 0}

        data["seq"] += 1
        with open(_COUNTER_PATH, "w") as f:
            json.dump(data, f)

    return f"{data['seq']:03d}/{year}"


def _logo_data_uri() -> str:
    try:
        with open(_LOGO_PATH, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        return f"data:image/jpeg;base64,{b64}"
    except Exception:
        return ""


def _build_invoice_html(c: dict) -> str:
    prenom      = c.get("prenom", "") or ""
    nom         = c.get("nom", "") or ""
    adresse     = c.get("adresse", "") or ""
    categorie   = c.get("categorie", "B") or "B"
    montant_ttc = float(c.get("montantTotal", 0) or 0)
    montant_ht  = montant_ttc - TVA_FIXE
    today       = date.today().strftime("%d/%m/%y")
    facture_num = _next_invoice_number()
    logo_uri    = _logo_data_uri()

    logo_html = (
        f'<img src="{logo_uri}" style="width:60px;height:60px;object-fit:cover;border-radius:50%;display:block;" alt="" />'
        if logo_uri else
        '<div style="width:60px;height:60px;border:1px solid #ccc;border-radius:50%;"></div>'
    )

    empty_rows = "\n".join(
        '<tr><td></td><td></td><td></td><td></td><td></td></tr>'
        for _ in range(3)
    )

    def copy_html():
        return f"""
<div class="copy">
  <table class="header-tbl">
    <tr>
      <td class="logo-cell" rowspan="2">
        {logo_html}
      </td>
      <td class="school-name" colspan="2">AUTO ECOLE AL BAYAN</td>
    </tr>
    <tr>
      <td class="addr-label">Adresse client :</td>
      <td class="addr-val">{adresse}</td>
    </tr>
  </table>

  <div class="date-line">{today}</div>

  <table class="info-tbl">
    <tr>
      <td class="client-name">{prenom} &nbsp; {nom}</td>
      <td class="facture-num">FACTURE N° {facture_num}</td>
      <td class="cat-cell">CATEGORIE &nbsp; <strong>{categorie}</strong></td>
    </tr>
  </table>

  <table class="data-tbl">
    <thead>
      <tr>
        <th>Formation</th>
        <th>CINE</th>
        <th>Nbres d'heures</th>
        <th>Prix ttc en DH</th>
        <th>Total montant (Dhttc)</th>
      </tr>
    </thead>
    <tbody>
      {empty_rows}
      <tr class="total-row">
        <td colspan="3" class="empty-total"></td>
        <td class="total-lbl">Montants T.T.C</td>
        <td class="total-val">{montant_ttc:,.2f}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" class="empty-total"></td>
        <td class="total-lbl">Montants H.T</td>
        <td class="total-val">{montant_ht:,.2f}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" class="empty-total"></td>
        <td class="total-lbl tva-lbl">TVA</td>
        <td class="empty-total"></td>
        <td class="total-val">{TVA_FIXE:,.2f}</td>
      </tr>
    </tbody>
  </table>
</div>"""

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {{ size: A4; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Arial', 'Helvetica', sans-serif;
    font-size: 11px;
    color: #000;
    background: white;
  }}

  .copy {{
    width: 210mm;
    height: 143mm;
    padding: 7mm 12mm 5mm 12mm;
    overflow: hidden;
  }}

  .separator {{
    border-top: 1.5px dashed #555;
    margin: 0;
  }}

  /* Header table */
  .header-tbl {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1mm;
  }}
  .header-tbl td {{ padding: 1px 4px; vertical-align: middle; }}
  .logo-cell {{ width: 55px; vertical-align: middle; text-align: center; }}
  .logo-box {{
    width: 52px; height: 52px;
    border: 1.5px solid #444;
    display: flex; align-items: center; justify-content: center;
    background: #f8f8f8;
  }}
  .logo-text {{ font-size: 7px; font-weight: bold; text-align: center; line-height: 1.3; color: #333; }}
  .school-name {{
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 1.5px;
    font-family: 'Impact', 'Arial Black', 'Arial', sans-serif;
    padding-bottom: 2px;
  }}
  .addr-label {{ width: 90px; font-weight: bold; white-space: nowrap; }}
  .addr-val {{ }}

  /* Date */
  .date-line {{
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    margin: 1.5mm 0;
  }}

  /* Info row */
  .info-tbl {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2mm;
  }}
  .info-tbl td {{ padding: 0 4px; }}
  .client-name {{ font-weight: bold; font-size: 11.5px; width: 30%; }}
  .facture-num {{ text-align: center; font-weight: bold; font-size: 11.5px; width: 40%; }}
  .cat-cell {{ text-align: right; font-size: 11px; width: 30%; }}

  /* Data table */
  .data-tbl {{
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
  }}
  .data-tbl th {{
    border: 1px solid #000;
    padding: 3px 4px;
    text-align: center;
    font-weight: bold;
    background: #f0f0f0;
    white-space: nowrap;
  }}
  .data-tbl td {{
    border: 1px solid #000;
    padding: 0;
    height: 8mm;
    text-align: center;
    vertical-align: middle;
  }}
  .data-tbl th:nth-child(1), .data-tbl td:nth-child(1) {{ width: 28%; }}
  .data-tbl th:nth-child(2), .data-tbl td:nth-child(2) {{ width: 14%; }}
  .data-tbl th:nth-child(3), .data-tbl td:nth-child(3) {{ width: 14%; }}
  .data-tbl th:nth-child(4), .data-tbl td:nth-child(4) {{ width: 22%; }}
  .data-tbl th:nth-child(5), .data-tbl td:nth-child(5) {{ width: 22%; }}

  .total-row td {{ font-weight: bold; height: 7mm; }}
  .empty-total {{ border: 1px solid #000; }}
  .total-lbl {{ text-align: right; padding-right: 6px; border: 1px solid #000; }}
  .total-val {{ text-align: center; border: 1px solid #000; }}
  .tva-lbl {{ text-align: right; padding-right: 6px; }}
</style>
</head>
<body>
{copy_html()}
<div class="separator"></div>
{copy_html()}
</body>
</html>"""


def generate_facture_pdf(client: dict) -> bytes:
    html = _build_invoice_html(client)
    return HTML(string=html).write_pdf()
