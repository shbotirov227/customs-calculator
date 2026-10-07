# Bojxona to'lovlari kalkulyatori: tahlil va vazifa chegarasi

## Maqsad va hajm

O'zbekistonga tijorat importi uchun bojxona to'lovlarini tushunarli tarzda hisoblaydigan demo yaratish. Hozirgi repo React 19 + TypeScript + Vite asosida lokal HS katalogi, sof hisoblash engine'i, ko'p tovarli ruscha UI va faqat to'liq, eskirmagan hisob snapshotidan yaratiladigan PDF eksportini o'z ichiga oladi. XML import faqat berilgan `GTD_eCopy_DefEdFormat` namunasi, preview va foydalanuvchi tasdig'i bilan cheklangan; ZIP upload va `eDataXML` import qilinmaydi. Git metama'lumoti mavjud, lekin oldingi bosqichlarning foydalanuvchi o'zgarishlari hali commit qilinmagan.

## Manbalar va topilmalar

- `КОДЫ-НОВЫЕ.xlsx`: bitta varaq, 13 138 ma'lumot qatori. Ustunlar: `Код` (ichki raqam), `Код` (TN VED/HS), `Ед. изм.`, `Описание`. HS kodi Excelda matn sifatida, bo'shliqlar olib tashlanganda barcha qatorlarda 10 raqamli; 1 514 kod `0` bilan boshlanadi. HS kodi bo'sh yoki dublikat emas. `Ед. изм.` ustunida 7 934 bo'sh qiymat bor. Faylda boj, QQS, aksiz yoki boshqa stavka ustunlari yo'q.
- `duty_calc_variants.html`: huquqiy manba emas, algoritm eskizi. Unda sertifikat, kelib chiqish/jo'natish/savdo mamlakati, sana va advalor bazaviy stavka bo'yicha boj rejimi tanlanadi. Qo'shimcha boj chegaralari pseudokodda `<10% -> 5%`, `10–<20% -> 10%`, `20–<30% -> 15%`, `>=30% -> 20%`; jadvaldagi `10–20`, `20–30` yozuvlari yuqori chegarani noaniq qoldiradi.
- `4911947.pdf`: 5 sahifa. Idoralararo qaror 2020-06-22 da qabul qilingan, 2020-06-30 da 3267-son bilan ro'yxatdan o'tgan va rasmiy e'lon qilingan kundan kuchga kiradi. Ilova 1 da MFN rejimidagi 47 davlat, ilova 2 da erkin savdo rejimidagi 10 davlat bor. Singapur faqat 2007-01-25 kelishuvining A-ilovasidagi tovarlar uchun, Turkmaniston esa o'zaro kelishilgan ro'yxatdagi tovarlar uchun maxsus shart bilan keltirilgan. Rasmiy manba: [LexUZ, 3267-son](https://lex.uz/pdffile/4911947).
- `6041645.pdf`: 15 sahifali 2022-yildagi asl UP-145 skani; lokal matn qatlami to'liq emas. Hujjat 2022-05-31 da imzolangan, 2022-06-01 da kuchga kirgan, ayrim choralar 2022-05-01 dan qo'llangan. Amaldagi 1-band UP-269 bilan 2026-01-01 dan yangilangan: ilova 1 tovarlari uchun nol boj hamda MFN bo'lmagan mamlakat tovarlari uchun qo'shimcha bojni qo'llamaslik 2027-01-01 gacha davom etadi. Rasmiy manbalar: [LexUZ, UP-145 amaldagi tahrir](https://www.lex.uz/ru/docs/6041645?ONDATE=01.01.2026), [LexUZ, UP-269](https://www.lex.uz/ru/docs/7964314).
- GTD materiali: alohida `ГТД.zip` topilmadi; `references/ГТД` ichida deklaratsiya ZIPi, e-hujjat ZIPi, 15 PDF va bitta aviayuk xati rasmi bor. PDF to'plami 54 sahifa; beshta PDFda o'qiladigan matn qatlami yo'q. `GTDXML.xml` rooti `GTD_eCopy_DefEdFormat`: `T1` deklaratsiya sarlavhasi, 7 marta takrorlangan `T2` tovar pozitsiyalariga mos keladi. Faqat `T1/T2/P4T2` tovar tavsifi va `T1/T2/P9T2` 10 raqamli HS kodi sifatida PDF bilan tasdiqlangan va importga map qilinadi. Bir xil HS kodli `T2` pozitsiyalari alohida saqlanadi. `T9` har pozitsiyaga bog'langan hujjat yozuvlariga o'xshaydi; `T4`, `T7`, `T8`, `T41` va `T26/T27` qiymat/to'lov bloklari bo'lishi mumkin, lekin `P…T…` nomlari va sxema yo'qligi sabab aniq semantika tasdiqlanmagan. Miqdor, birlik, bojxona qiymati, valuta va kurs import qilinmaydi; preview ularni yetishmayotgan deb ko'rsatadi. `eDataXML.xml` 12 ta `eDoc` va 14 ta base64 fayl blokini saqlaydi; frontend ularni avtomatik dekodlamaydi. XML faqat brauzerda, 512 KB limit bilan o'qiladi; noto'g'ri root, DTD/DOCTYPE/entity va aktiv markup rad etiladi. PDF/XML moslash real rekvizit yoki summalarni ko'chirmasdan faqat strukturaviy tekshirildi.
- Alohida “Telegram” nomli rasmlar topilmadi. `references` ichidagi yagona rasm aviayuk xati bo'lib, unda maxfiy jo'natuvchi/oluvchi va yuk rekvizitlari mavjud.

## Input va output

Majburiy inputlar: hisob sanasi; bojxona qiymati (invoice summasidan alohida); valuta, kurs, kurs sanasi va kurs birligi; 10 raqamli HS kodi; tovar tavsifi; miqdor va o'lchov birligi; kelib chiqish mamlakati; kelib chiqish sertifikati va imtiyozga asos bo'ladigan hujjat; bazaviy tarif turi (`advalorem`, birlik bo'yicha yoki kombinatsiyali), stavkasi va manbasi. Tegishli bo'lsa aksiz, QQS, rasmiylashtirish va boshqa yig'im stavkalari hamda ularning bazalari kerak.

Output har bir to'lov uchun baza, stavka/tur, summa, manba va holatni qaytaradi. Holatlar: `calculated`, `confirmed-zero`, `not-applicable`, `missing-input`, `unsupported`. Yetishmayotgan qism bo'lsa yakuniy jami ko'rsatilmaydi; mavjud oraliq natijalar “qisman hisob” deb belgilanadi.

## Tekshirilgan qoidalar

- 2026-02-28 dan Bojxona kodeksining 300¹-moddasi MFN bo'lmagan yoki kelib chiqishi aniqlanmagan tovar uchun bazaviy bojga qo'shimcha ravishda yuqoridagi 5/10/15/20 foizlik pog'onalarni belgilaydi. Sertifikat yo'q yoki shubhali bo'lsa 366-modda shu qo'shimcha bojga yo'naltiradi. Rasmiy manba: [LexUZ, O'RQ-1097](https://www.lex.uz/uz/acts/7865594?ONDATE=28.02.2026+00).
- 300¹-modda MFNni kelib chiqish mamlakati bo'yicha, jo'natish va eksport mamlakatidan qat'i nazar qo'llaydi. Shu sabab HTMLdagi uchala mamlakat bir xil ro'yxatda bo'lishi sharti amaldagi norma bilan mos emas.
- UP-145ning amaldagi tahriri 2027-01-01 gacha ilova 1 dagi tovarlarga nol bojni va MFN bo'lmagan mamlakat tovarlariga qo'shimcha boj olinmasligini belgilaydi. Imtiyoz faqat sana, HS qamrovi va zarur kelib chiqish hujjati tekshirilgach qo'llanadi.
- 3267-son qaror mamlakat ro'yxatlarini tasdiqlaydi, lekin o'zi HS bo'yicha bazaviy tarif stavkasi emas. Erkin savdo natijasi tegishli bitim, mahsulot istisnolari va kelib chiqish isboti bilan tekshiriladi.

## Noaniq yoki yetishmayotgan qoidalar

- HTMLdagi “sertifikat yo'q bo'lsa UP-145 qo'llanmaydi” xulosasi UP-145 matnida aynan shu shaklda topilmadi. Kelib chiqishi aniqlanmagan holatning vaqtinchalik imtiyozga kirishi huquqiy tasdiq talab qiladi.
- Bazaviy import boji stavkalari, per-unit va kombinatsiyali tariflarda `MAX` yoki `SUM` qoidasi berilmagan. Excel katalogi stavka manbasi emas.
- O'RQ-1097 qo'shimcha bojning 5/10/15/20 foizlik pog'onalarini tasdiqlaydi, ammo `10%`, `20%` va `30%` chegaralarini dasturiy intervalga aylantirish uchun berilgan HTMLdagi yarim ochiq intervallar huquqiy manba hisoblanmaydi. Vakolatli talqin yoki tasdiqlangan policy bo'lmaguncha bu qoida engine'da avtomatik qo'llanmaydi.
- QQS stavkasi va bazasi, aksiz, rasmiylashtirish yig'imi, utilizatsiya yoki boshqa maxsus yig'imlar uchun ushbu paketda yetarli amaldagi manba yo'q.
- Valuta kursining rasmiy provayderi, sana bo'yicha tanlash qoidasi va kotirovka birligi berilmagan.
- UP-145 ilova 1 ning amaldagi HS ro'yxati katalog bilan versiyalanmagan; nol stavkani oddiy HS mavjudligidan chiqarib bo'lmaydi.
- GTD qiymatlari tarixiy deklaratsiya dalili, lekin umumiy stavka yoki hisob formulasi manbasi emas. Opaque XML maydonlari uchun rasmiy XSD yoki GTD format spetsifikatsiyasi kerak.

## Missing-data usuli

Topilmagan stavka hech qachon `0`ga aylantirilmaydi. Har stavka `value`, `type`, `source`, `effectiveFrom/effectiveTo` va `status` bilan saqlanadi. Nol faqat manbada aniq tasdiqlansa `confirmed-zero`; topilmagan qiymat `missing-input`; qo'llanmaydigan to'lov `not-applicable`; formula yoki kombinatsiya tasdiqlanmasa `unsupported`. Qo'lda kiritilgan stavka alohida belgilanadi va manba stavkasidek ko'rsatilmaydi.

## Maxfiy fayllar bilan muomala

`references/`, GTD ZIP/XML/PDF/JPG va ildizga tushishi mumkin bo'lgan xom manbalar `.gitignore` bilan himoyalanadi. Ular `public/`, build artefakti, demo JSON, kod, log, test fixture yoki javobga kiritilmaydi. Parser keyingi bosqichda faqat lokal ishlaydi; real qiymatlar o'rniga sintetik fixture ishlatiladi. XMLda DTD/external entity rad etiladi, e-hujjat base64 bloklari avtomatik ochilmaydi.

## Acceptance criteria

- HS kod string sifatida saqlanadi; bosh nol yo'qolmaydi, dublikat va bo'sh kod alohida tekshiriladi.
- Sana bo'yicha amaldagi huquqiy tahrir tanlanadi; manba va amal qilish oralig'i natijada ko'rinadi.
- MFN/FTA qarori jo'natish yoki savdo mamlakati bilan sun'iy pasaytirilmaydi; maxsus mahsulot ro'yxatlari tekshiriladi.
- Missing, haqiqiy nol, qo'lda stavka va qo'llanmaydigan holat UI hamda hisobda farqlanadi.
- Pul arifmetikasi `decimal.js` bilan, yagona yaxlitlash siyosati orqali bajariladi; to'liq bo'lmagan hisob jami yoki final PDFga aylanmaydi.
- Hech bir real GTD rekviziti repository, dist, log, demo yoki testga chiqmaydi.

## Qolgan ishlar

1. Amaldagi tarif, QQS, aksiz, yig'im va valuta kursi manbalarini kelishib, sanaga bog'langan complete policy modelini tuzish.
2. Desktop va 390 px mobil layoutni haqiqiy brauzerda, shuningdek final PDF download oqimini qo'lda tekshirish.
3. Faqat alohida ruxsatdan keyin repository'ni Git provayderiga push qilish va Vercelga deploy qilish.
