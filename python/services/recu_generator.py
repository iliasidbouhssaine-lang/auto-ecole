import base64
import os
from datetime import date
from weasyprint import HTML

_LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "logo.jpeg")


def _logo_data_uri() -> str:
    try:
        with open(_LOGO_PATH, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        return f"data:image/jpeg;base64,{b64}"
    except Exception:
        return ""


def _fmt_date(iso: str) -> str:
    if iso and "-" in iso:
        parts = iso.split("-")
        if len(parts) == 3:
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return iso or ""


def _build_recu_html(c: dict) -> str:
    prenom_ar     = c.get("prenomAr", "") or ""
    nom_ar        = c.get("nomAr", "") or ""
    montant_total = float(c.get("montantTotal", 0) or 0)
    payments      = (c.get("payments", []) or [])[:5]
    today         = date.today().strftime("%d/%m/%Y")
    logo_uri      = _logo_data_uri()

    total_paid = sum(float(p.get("montant", 0)) for p in payments)
    remaining  = montant_total - total_paid

    logo_html = (
        f'<img src="{logo_uri}" style="width:58px;height:58px;object-fit:cover;border-radius:50%;display:block;" alt="" />'
        if logo_uri else ""
    )

    pay_rows = ""
    for i in range(5):
        label = f"الدفعة{i + 1}"
        if i < len(payments):
            amount = f"{float(payments[i].get('montant', 0)):,.2f}"
            dt = _fmt_date(payments[i].get("date", ""))
        else:
            amount = ""
            dt = ""
        pay_rows += f"""
      <tr>
        <td class="lbl">{label} :</td>
        <td class="val-box">{amount}</td>
        <td class="fi">في</td>
        <td class="date-box">{dt}</td>
      </tr>"""

    def copy_html():
        return f"""
<div class="copy">
  <div class="top-bar">
    <span class="school-ltr">AUTO ECOLE AL BAYAN</span>
    <span class="top-date">{today}</span>
    <span class="school-ar">مدارة التعليم البيان</span>
  </div>

  <div class="title-row">
    <div class="logo-wrap">{logo_html}</div>
    <div class="center-title">
      <div class="recu-bold">RECU</div>
      <div class="recu-sub">توصيل الأداء الخاص بالمرشح</div>
    </div>
    <div class="client-info">
      <div class="ci-row"><span class="ci-lbl">الإسم</span><span> : </span><span>{prenom_ar}</span></div>
      <div class="ci-row"><span class="ci-lbl">النسب</span><span> : </span><span>{nom_ar}</span></div>
    </div>
  </div>

  <table class="pay-tbl">
    <tbody>
      <tr>
        <td class="lbl amber">المبلغ الإجمالي :</td>
        <td class="val-box">{montant_total:,.2f}</td>
        <td class="fi"></td>
        <td class="date-box"></td>
      </tr>
      {pay_rows}
      <tr>
        <td class="lbl amber">مجموع الدفعات :</td>
        <td class="val-box">{total_paid:,.2f}</td>
        <td class="fi"></td>
        <td class="date-box"></td>
      </tr>
      <tr>
        <td class="lbl amber">الباقي :</td>
        <td class="val-box">{remaining:,.2f}</td>
        <td class="fi"></td>
        <td class="date-box"></td>
      </tr>
    </tbody>
  </table>

  <div class="sigs">
    <div class="sig-left">امضاء مسؤول المؤسسة</div>
    <div class="sig-right">امضاء المرشح</div>
  </div>
</div>"""

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {{ size: A4; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Tahoma', 'Arial', sans-serif;
    font-size: 11px;
    color: #000;
  }}

  .copy {{
    width: 210mm;
    height: 143mm;
    padding: 6mm 14mm 4mm 14mm;
    overflow: hidden;
  }}

  .separator {{ border-top: 1.5px dashed #555; }}

  /* Top bar */
  .top-bar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3mm;
  }}
  .school-ltr {{ font-size: 9px; font-weight: bold; letter-spacing: 0.5px; }}
  .top-date {{ font-size: 14px; font-weight: bold; }}
  .school-ar {{ font-size: 10px; direction: rtl; }}

  /* Title row — logo & client-info absolute so title is truly centred */
  .title-row {{
    position: relative;
    text-align: center;
    margin-bottom: 4mm;
    min-height: 62px;
  }}
  .logo-wrap {{
    position: absolute;
    left: 0; top: 0;
    width: 62px;
  }}
  .center-title {{
    display: inline-block;
    text-align: center;
    padding-top: 2px;
  }}
  .recu-bold {{ font-size: 20px; font-weight: bold; letter-spacing: 3px; }}
  .recu-sub {{
    font-size: 12px; font-weight: bold;
    text-decoration: underline;
    direction: rtl;
    margin-top: 3px;
  }}
  .client-info {{
    position: absolute;
    right: 0; top: 0;
    width: 160px;
    direction: rtl; text-align: right;
    font-size: 11px; padding-top: 2px;
  }}
  .ci-row {{ margin-bottom: 3px; }}

  /* Payment table */
  .pay-tbl {{
    width: 72%;
    border-collapse: collapse;
    direction: rtl;
    margin: 0 auto;
    font-size: 11px;
  }}
  .pay-tbl td {{ padding: 2px 6px; vertical-align: middle; }}

  .lbl {{
    text-align: right;
    white-space: nowrap;
    width: 36%;
    font-size: 10.5px;
  }}
  .lbl.amber {{ color: #c47a00; font-weight: bold; }}

  .val-box {{
    border: 1px solid #000;
    width: 23%;
    text-align: center;
    font-size: 10.5px;
    height: 17px;
  }}

  .fi {{
    text-align: center;
    width: 5%;
    font-size: 10px;
  }}

  .date-box {{
    border: 1px solid #000;
    width: 36%;
    font-size: 10px;
    text-align: center;
    height: 17px;
    direction: ltr;
  }}

  /* Signatures */
  .sigs {{
    display: flex;
    justify-content: space-between;
    margin-top: 6mm;
    padding: 0 5mm;
    font-size: 11px;
    font-weight: bold;
  }}
  .sig-left {{ text-decoration: underline; }}
  .sig-right {{ direction: rtl; }}
</style>
</head>
<body>
{copy_html()}
<div class="separator"></div>
{copy_html()}
</body>
</html>"""


def generate_recu_pdf(client: dict) -> bytes:
    html = _build_recu_html(client)
    return HTML(string=html).write_pdf()
