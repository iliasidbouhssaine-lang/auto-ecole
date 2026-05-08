from datetime import date
from weasyprint import HTML


def _fmt_date(iso: str) -> str:
    if iso and "-" in iso:
        parts = iso.split("-")
        if len(parts) == 3:
            return f"{parts[0]}/{parts[1]}/{parts[2]}"
    return iso or ""


def _build_html(c: dict) -> str:
    sexe        = c.get("sexe", "M")
    sid         = "السيدة" if sexe == "F" else "السيد"
    mzd         = "المزدادة" if sexe == "F" else "المزداد"
    qat         = "القاطنة" if sexe == "F" else "القاطن"
    prenom_ar   = c.get("prenomAr", "") or ""
    nom_ar      = c.get("nomAr", "") or ""
    cin         = c.get("numeroIdentite", "") or ""
    lieu_ar     = c.get("lieuNaissanceAr", "") or ""
    date_naiss  = _fmt_date(c.get("dateNaissance", ""))
    adresse_ar  = c.get("adresseAr", "") or ""
    num_dossier = c.get("numDossier", "") or ""
    categorie   = c.get("categorie", "B") or "B"
    today       = date.today().strftime("%Y/%m/%d")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {{ size: A4; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}

  body {{
    font-family: 'Tahoma', 'Arial', 'Simplified Arabic', sans-serif;
    font-size: 10.5px;
    color: #000;
    direction: rtl;
    line-height: 1.44;
    padding: 9mm 12mm 6mm 12mm;
  }}

  /* ── Title ── */
  .title {{
    text-align: center;
    font-size: 13.5px;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 1px;
  }}
  .subtitle {{
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 5px;
  }}
  .cat-box {{
    border: 1px solid #000;
    display: inline-block;
    min-width: 30px;
    padding: 0 6px;
    font-weight: bold;
    font-size: 12px;
  }}

  /* ── Header row رقم / بتاريخ ── */
  .hdr {{
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
    font-size: 10.5px;
  }}

  /* ── Tables shared ── */
  table {{
    width: 100%;
    border-collapse: collapse;
    direction: rtl;
    margin-bottom: 2px;
  }}
  td {{ padding: 1.5px 3px; vertical-align: middle; text-align: right; }}

  /* ── Company table ── */
  .co td.r {{ width: 63%; text-align: right; }}
  .co td.l {{ width: 37%; text-align: right; }}

  /* ── Client table ── */
  .cl td {{ font-size: 10.3px; }}

  /* ── Section title ── */
  .sec {{
    text-align: center;
    font-weight: bold;
    text-decoration: underline;
    margin: 5px 0 3px;
    font-size: 10.5px;
  }}

  /* ── Articles ── */
  .art {{
    font-size: 10.2px;
    line-height: 1.42;
    margin-bottom: 3.5px;
  }}
  .art-t {{
    font-weight: bold;
    display: block;
    margin-bottom: 1px;
  }}
  .box {{
    border: 1px solid #000;
    display: inline-block;
    min-width: 28px;
    padding: 0 5px;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
  }}

  /* ── Footer ── */
  .ft-date {{ text-align: center; margin-top: 8px; font-size: 10.5px; }}
  .ft-sigs {{ display: flex; justify-content: space-between; margin-top: 5px; }}
  .ft-sigs span {{ font-weight: bold; font-size: 10.5px; text-decoration: underline; }}
</style>
</head>
<body>

<div class="title">عقد التكوين بين المرشح و مؤسسة تعليم السياقة</div>
<div class="subtitle">رخصة السياقة من صنف <span class="cat-box">{categorie}</span></div>

<div class="hdr">
  <span>رقـم :</span>
  <span>بتاريخ : {today}</span>
</div>

<p style="margin-bottom:2px; font-size:10.3px"><strong>طرفي العقد</strong> : هذا العقد مبرم بين :</p>

<!-- Company info table: RIGHT col = label (63%), LEFT col = value (37%) -->
<table class="co">
  <tr>
    <td class="r"><strong>مؤسسة تعليم السياقة :</strong></td>
    <td class="l"><strong>البيان</strong></td>
  </tr>
  <tr>
    <td class="r">رقم القيد في السجل الوطني الخاص بمؤسسات تعليم السياقة :</td>
    <td class="l">6956</td>
  </tr>
  <tr>
    <td colspan="2" style="text-align:right">العنوان :تجزئة حمزة 1 رقم 203 اسكجور المحاميد مراكش</td>
  </tr>
  <tr>
    <td class="r">رقم القيد في سجل الضريبة المهنية :</td>
    <td class="l">64602018</td>
  </tr>
  <tr>
    <td class="r">رقم القيد في السجل التجاري : &nbsp;&nbsp;&nbsp;&nbsp; 125007</td>
    <td class="l">المدينة : &nbsp;&nbsp;&nbsp;&nbsp; مراكش</td>
  </tr>
  <tr>
    <td class="r">الهاتف : &nbsp; <span dir="ltr">07 08 01 04 12</span></td>
    <td class="l">الفاكس : &nbsp; <span dir="ltr">05 25 14 82 52</span></td>
  </tr>
  <tr>
    <td colspan="2" style="text-align:center">
      البريد الإلكتروني : &nbsp; Autoecolealbayan@gmail.com
    </td>
  </tr>
</table>

<!-- Client info: 3 equal columns, RTL order: label | prenom | nom -->
<table class="cl">
  <tr>
    <td style="width:20%; white-space:nowrap">و {sid} :</td>
    <td style="width:40%">{prenom_ar}</td>
    <td style="width:40%">{nom_ar}</td>
  </tr>
  <tr>
    <td style="white-space:nowrap">رقـم بـو.ت.إ : &nbsp;<strong>{cin}</strong></td>
    <td style="white-space:nowrap">{mzd} ب : &nbsp;<strong>{lieu_ar}</strong></td>
    <td style="white-space:nowrap">بتاريخ : &nbsp;<strong>{date_naiss}</strong></td>
  </tr>
  <tr>
    <td colspan="3">{qat} ب : &nbsp;<strong>{adresse_ar}</strong></td>
  </tr>
  <tr>
    <td colspan="3">رقم تسجيل المرشح الممنوح من طرف الإدارة (Référence web) : &nbsp;<strong>{num_dossier}</strong></td>
  </tr>
</table>

<div class="sec">اتفق الطرفان على مايلي</div>

<div class="art">
  <span class="art-t">المادة الأولى : موضوع العقد</span>
  يهدف هذا العقد الى تكوين المرشح و تمكينه من اكتساب المعارف والمهارات الضرورية التي تمكنه من سياقة مركبة تتطلب
  قيـادتـها رخصـة السيـاقـة مـن صنف <span class="box">{categorie}</span> طبقا للبرامج المحددة من طرف الإدارة.
  كما يحدد حقوق وواجبات كلا الطرفين مع مراعاة القوانين والأنظمة الجاري بها العمل في هذا الشأن.
</div>

<div class="art">
  <span class="art-t">المادة 2 : مدة العقد</span>
  يمتد هذا العقد لمدة ستة أشهرابتداء من تاريخ توقيعه.ويمكن تمديده في حالة الاتفاق بين الطرفين لمدة لا تتعدى ثلاثة أشهر
</div>

<div class="art">
  <span class="art-t">المادة 3 : التزامات المؤسسة</span>
  تلتزم المؤسسة بتكوين المرشح طبقا للبرنامج الوطني لتعليم السياقة.
  تلقن الدروس النظرية والتطبيقية تحت إشراف مدير المؤسسة، من طرف مدرب أومدربي تعليم السياقة مرخص لهم، تشغلهم المؤسسة لهذا الغرض وبواسطة مركبات لتعليم السياقة في ملكيتها.
  تلتزم المؤسسة بتوفير المركبة التي يتم بواسطتها إجراء الاختبار التطبيقي.
  لا يمكن الشروع في التكوين النظري إلا بعد حصول المرشح على رقم التسجيل الممنوح له من طرف الإدارة.
  تلتزم المؤسسة بإخبار المرشح بحصوله على هذا الرقم،كما تلتزم بتسليم المرشح شهادة نهاية التكوين فور إنهائه له.
  تحتفظ المؤسسة بحق إرجاء دروس التكوين إلى تاريخ لاحق في كل الحالات التي تكون فيها السلامة غير متوفرة
  بعد استفادة المرشح من عدد ساعات التكوين النظري والتطبيقي المتفق عليها، تلتزم المؤسسة بتقديمه لاجتياز الامتحانات لنيل رخصة السياقة في حدود المقاعد المقنوحة من طرف الإدارة
</div>

<div class="art">
  <span class="art-t">المادة 4 : التزامات المرشح</span>
  إذا توقف المرشح عن التكوين، سواء بصفة مؤقتة أو نهائية، و كيفما كانت الأسباب، يلتزم بإخبار المؤسسة كتابيا،
  في حالة التوقف لأكثر من ثلاثة (3) أشهر متتالية، يحق للمؤسسة مطالبة المرشح بأداء مبالغ الخدمات المتبقية، و غير المؤداة :
  إذا انقطع المرشح عن التكوين لمدة تفوق ستة (6) أشهر، يعتبر متخليا عن التكوين و لا يحق به أن يسترجع ما دفعه من أجله.
  إذا تخلى المرشح عن التكوين لسبب يعود له، يؤدي التعريفة كاملة.
  في حالة عدم النجاح في الإمتحان، يلتزم المرشح بأداء مصاريف إعادة تكوينه و فقا لنفس التعريفة.
</div>

<div class="art">
  <span class="art-t">المادة 5 : مدة التكوين</span>
  اتفق الطرفان على تحديد عدد ساعات التكوين في
  <span class="box">20</span> ساعة بالنسبة للتكوين النظري و
  <span class="box">20</span> ساعة بالنسبة للتكوين التطبيقي
  لا يقل هذا العدد عن العدد الأدنى المحدد بالمادة 32 من دفتر التحملات الخاص بفتح و استغلال مؤسسات تعليم السياقة.
</div>

<div class="art">
  <span class="art-t">المادة 6 : تعريفة التكوين</span>
  تحتسب التعريفة الإجمالية للتكوين على أساس تعريفة ساعة التكوين النظري و التطبيقي المحددة في المادة 1 من القرار الذي
  يحدد تعريفة ساعة التكوين النظري و التطبيقي.
</div>

<div class="art">
  <span class="art-t">المادة 7 : كيفيات الأداء</span>
  تسلم للمرشح فاتورة تحدد المبالغ المدفوعة للمؤسسة، تكون هذه الفاتورة مؤرخة و موقعة من طرف صاحب المؤسسة و تحمل
  هذه الفاتورة اسم و طابع المؤسسة، و فقا للتشريعات الجاري بها العمل.
  في حالة الاتفاق بين الطرفين، يمكن أداء مبلغ التكوين على أقساط.
</div>

<div class="ft-date">في &nbsp;&nbsp; مراكش &nbsp;&nbsp;&nbsp;&nbsp; بتاريخ : {today}</div>

<div class="ft-sigs">
  <span>توقيع صاحب المؤسسة أو ممثله القانوني</span>
  <span>توقيع المرشح أو ولي أمره مصادق عليه</span>
</div>

</body>
</html>"""


def generate_contract_pdf(client: dict) -> bytes:
    html = _build_html(client)
    return HTML(string=html).write_pdf()
