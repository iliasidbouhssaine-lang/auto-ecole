from datetime import date
from weasyprint import HTML


def _fmt_date(iso: str) -> str:
    if iso and "-" in iso:
        parts = iso.split("-")
        if len(parts) == 3:
            return f"{parts[0]}/{parts[1]}/{parts[2]}"
    return iso or ""


def _build_formel_html(c: dict) -> str:
    sexe       = c.get("sexe", "M")
    sid        = "السيدة" if sexe == "F" else "السيد"
    hml        = "الحاملة" if sexe == "F" else "الحامل"
    tlq        = "تلقت" if sexe == "F" else "تلقى"
    kwnh       = "تكوينها" if sexe == "F" else "تكوينه"
    prenom_ar  = c.get("prenomAr", "") or ""
    nom_ar     = c.get("nomAr", "") or ""
    cin        = c.get("numeroIdentite", "") or ""
    num_dossier= c.get("numDossier", "") or ""
    categorie  = c.get("categorie", "B") or "B"
    contrat_dt = _fmt_date(c.get("dateContrat", "") or c.get("dateInscription", ""))
    today      = date.today().strftime("%Y/%m/%d")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {{ size: A4; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Tahoma', 'Arial', 'Simplified Arabic', sans-serif;
    font-size: 12px;
    color: #000;
    direction: rtl;
    line-height: 1.55;
    padding: 10mm 12mm 6mm 12mm;
  }}

  .title {{
    text-align: center;
    font-size: 17px;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 10px;
  }}

  table {{ width: 100%; border-collapse: collapse; direction: rtl; margin-bottom: 3px; }}
  td {{ padding: 2.5px 4px; vertical-align: middle; text-align: right; font-size: 11.5px; }}

  /* Company table */
  .co td.r {{ width: 63%; text-align: right; }}
  .co td.l {{ width: 37%; text-align: right; }}

  /* Representative table — bordered */
  .rep {{ border: 1px solid #000; margin-bottom: 8px; }}
  .rep td {{ border-bottom: 1px solid #ddd; padding: 3.5px 7px; font-size: 11.5px; }}
  .rep tr:last-child td {{ border-bottom: none; }}
  .rep td.lbl {{ width: 30%; font-weight: normal; white-space: nowrap; }}
  .rep td.val {{ width: 70%; }}

  .section-lbl {{
    font-weight: bold;
    text-decoration: underline;
    margin: 5px 0 4px;
    font-size: 12px;
    display: block;
  }}

  .candidate-line {{
    margin-bottom: 4px;
    font-size: 12px;
    line-height: 1.7;
  }}

  .box {{
    border: 1px solid #000;
    display: inline-block;
    min-width: 28px;
    padding: 0 6px;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
  }}

  .training-block {{
    font-size: 11.8px;
    line-height: 1.6;
    margin-bottom: 4px;
  }}

  /* Signature boxes */
  .sigs {{
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 14px;
  }}
  .sig-item {{
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }}
  .sig-label {{
    text-align: center;
    font-size: 11px;
    font-weight: bold;
  }}
  .sig-box {{
    border: 1px solid #555;
    min-height: 80px;
  }}

  .footer {{
    text-align: right;
    font-size: 10.5px;
    margin-top: 6px;
    font-weight: bold;
  }}
</style>
</head>
<body>

<div class="title">شهادة نهاية التكوين في تعليم السياقة</div>

<!-- Company info table -->
<table class="co">
  <tr>
    <td class="r"><strong>العلامة التجارية للمؤسسة أو الإسم التجاري للمؤسسة :</strong></td>
    <td class="l"><strong>البيان</strong></td>
  </tr>
  <tr>
    <td class="r">رقـم الرخصــة :</td>
    <td class="l">6956</td>
  </tr>
  <tr>
    <td class="r">رقم القيد في السجل الوطني الخاص بمؤسسات تعليم السياقة :</td>
    <td class="l">6956</td>
  </tr>
  <tr>
    <td class="r" style="font-size:10px">
      رقم القيد في سجل الضريبة المهنية : &nbsp; 64602018
      &nbsp;&nbsp; رقم القيد في السجل التجاري : &nbsp; 125007
    </td>
    <td class="l">المدينة: &nbsp; مراكش</td>
  </tr>
  <tr>
    <td colspan="2" style="text-align:right">العنوان :تجزئة حمزة 1 رقم 203 اسكجور المحاميد مراكش</td>
  </tr>
  <tr>
    <td class="r">الـهـاتـف &nbsp;: &nbsp; <span dir="ltr">07 08 01 04 12</span></td>
    <td class="l">الفـاكس : &nbsp; <span dir="ltr">0525148252</span></td>
  </tr>
  <tr>
    <td colspan="2" style="text-align:right">البريد الإلكتروني: &nbsp; Autoecolealbayan@gmail.com</td>
  </tr>
</table>

<span class="section-lbl">الممثل القانوني للمؤسسة :</span>

<!-- Representative table (bordered) -->
<table class="rep">
  <tr>
    <td class="lbl">الإسم الشخصي:</td>
    <td class="val">زكرياء</td>
  </tr>
  <tr>
    <td class="lbl">الإسم العائلي :</td>
    <td class="val">لحياني</td>
  </tr>
  <tr>
    <td class="lbl">العنوان :</td>
    <td class="val">تجزئة حمزة 1 رقم 203 اسكجور المحاميد مراكش</td>
  </tr>
  <tr>
    <td class="lbl">رقم الهاتف :</td>
    <td class="val"><span dir="ltr">07 08 01 04 12</span></td>
  </tr>
</table>

<!-- Candidate section -->
<div class="candidate-line">أشـهد ان {sid}(ة): &nbsp;&nbsp; <strong>{prenom_ar} &nbsp; {nom_ar}</strong></div>
<div class="candidate-line">{hml} (ة) للبطاقة الوطنية للتعريف رقـم : &nbsp;&nbsp; <strong>{cin}</strong></div>
<div class="candidate-line">الرقم الممنوح من طرف الإدارة (référence web) : &nbsp;&nbsp; <strong>{num_dossier}</strong></div>
<div class="candidate-line">بناء على عقد التكوين الموقع بين الطرفين بتاريـــخ: &nbsp;&nbsp; <strong>{contrat_dt}</strong></div>

<!-- Training details -->
<div class="training-block">
  {tlq} بهذه المؤسسة دروسا نظرية و تطبيقية في تعليم سياقة المركبات من صنف
  <span class="box">{categorie}</span> بما مجموعه:
  <span class="box">20</span> ساعة
</div>
<div class="training-block">
  ســيبـة للتكـوين النظـري و
  <span class="box">20</span>
  ساعة بالنسبة للتكوين التطبيقي طبقا للبرنامج الوطني لتعليم السياقة.
</div>
<div class="training-block">وقد أشرف على التكوين النظري المدرب الوارد اسمه بعده:</div>

<table style="margin-bottom:2px">
  <tr>
    <td style="width:50%">اسم المدرب: &nbsp; <strong>الحيان صديق</strong></td>
    <td style="width:50%; text-align:right">رقم رخصته : &nbsp; <strong>9833</strong></td>
  </tr>
</table>

<div class="training-block">وأشرف على التكوين التطبيقي المدرب الوارد اسمه بعده :</div>

<table style="margin-bottom:2px">
  <tr>
    <td style="width:50%">اسم المدرب: &nbsp; <strong>الحيان صديق</strong></td>
    <td style="width:50%; text-align:right">رقم رخصته : &nbsp; <strong>9833</strong></td>
  </tr>
</table>

<div class="training-block">
  كما {tlq} ({kwnh}) تكوينه (ها) بواسطة المركبة من صنف
  <span class="box">{categorie}</span>
  المسجلة تحت رقم :
  <span class="box" style="min-width:60px; font-size:9.5px">26861/أ/38</span>
  في اسم المؤسسة.
</div>

<!-- Signature boxes -->
<div class="sigs">
  <div class="sig-item">
    <div class="sig-label">اسم و توقيع المترشح</div>
    <div class="sig-box"></div>
  </div>
  <div class="sig-item">
    <div class="sig-label">طابع المؤسسة واسم وتوقيع الممثل القانوني للمؤسسة</div>
    <div class="sig-box"></div>
  </div>
</div>

<div class="footer">حرر بمراكش &nbsp;&nbsp; بتـاريخ: &nbsp; {today}</div>

</body>
</html>"""


def generate_attestation_formel_pdf(client: dict) -> bytes:
    html = _build_formel_html(client)
    return HTML(string=html).write_pdf()
