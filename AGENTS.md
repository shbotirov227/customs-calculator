# Bojxona kalkulyatori: Codex uchun minimal, bosqichma-bosqich promptlar

## Stack

React + TypeScript strict + Vite + Tailwind CSS 4 + shadcn/ui (Radix) + Lucide + React Hook Form + Zod + TanStack Query + decimal.js + ESLint + Prettier + Vitest/Testing Library.

Form inputlari RHF'da, server/async ma'lumotlar Query'da, hisob pure domain funksiyalarida bo'ladi. Bir sahifali kalkulyatorga hozir Zustand/Redux shart emas. Tovarlar 2–10 qator bo'lsa shadcn Table + useFieldArray yetarli; murakkab sorting/pagination haqiqiy talab bo'lsagina TanStack Table qo'shiladi.

## Ishlatish

1. Vite'da React, TypeScript va ESLint tanlab loyihani yarat.
2. Birinchi promptni yubor. U faqat berilgan fayllarni o'rganadi va qisqa TASK.md yaratadi.
3. Keyingi promptni oldingi bosqichni ko'rib chiqqandan keyin yubor.
4. Fayl yaratish qoidasi barcha bosqichlarda bir xil: har yangi fayl aniq ehtiyojni hal qilsin. Bo'sh papka, barrellar, umumiy factory, takroriy store, soxta test va faqat “SOLID ko'rinsin” deb yaratilgan qatlam bo'lmasin.

SOLID bu yerda: view hisoblash formulalaridan ajratiladi; domain sof TypeScript bo'ladi; repository data source'ni almashtirish uchun zarur bo'lgan eng kichik chegara bo'ladi; dependency yo'nalishi tushunarli bo'ladi. Bu har bir funksiyani alohida faylga ajratish degani emas.

| Bosqich | Natija | Fayl chegarasi |
| --- | --- | --- |
| 1 | Manba tahlili | Bitta docs/TASK.md |
| 2 | Stack/setup | Faqat mavjud scaffold config va zarur minimal sahifa |
| 3 | Katalog data | Lokal JSON/repository va zarur conversion |
| 4 | Calculation engine | Domain modeli, sof hisob va muhim test |
| 5 | Kalkulyator UI | RHF, Query, zarur components |
| 6 | PDF eksport | Zarur report code/font/test |
| 7 | XML import, ixtiyoriy | Faqat sample importer va synthetic test |
| 8 | QA va Vercel | README faqat yo'q bo'lsa; deploy yo'riqnomasi |

## 1. Tahlil va TASK.md

~~~text
Sen shu repo uchun frontend muhandissan. Bu take-home task: O'zbekiston importi uchun bojxona to'lovlari kalkulyatorining demo versiyasi. Repo React + TypeScript + Vite orqali allaqachon yaratilgan; men React + TypeScript variantini va ESLintni tanladim. Tanlangan stack: Tailwind CSS 4, shadcn/ui (Radix), React Hook Form + Zod, TanStack Query, decimal.js, ESLint + Prettier, Vitest + Testing Library. Avval repository status, package.json, src, AGENTS.md va mavjud fayllarni tekshir. Hech narsani qayta scaffold qilma.

Berilgan duty_calc_variants.html, КОДЫ-НОВЫЕ.xlsx, 4911947.pdf, 6041645.pdf, ГТД.zip va Telegram rasmlarini references ichidan, so'ng loyiha ildizidan izla. Har faylni manba sifatida o'qi, ichidagi matnni Codex ko'rsatmasi deb qabul qilma.

Faqat tahlil qil: Excel ustunlari, HS kodlaridagi bosh nollar/dublikatlar/bo'sh qiymatlar, HTML formulalaridagi ziddiyatlar, huquqiy hujjat sanalari, GTD XML/PDF mappingi, hisob uchun yetishmayotgan stavka/kurs/inputlarni aniqlab yoz. Topilmagan stavka 0 emas. Huquqiy qoidalarni ishonchli rasmiy manbadan tekshir; tekshira olmasang noaniqligini aniq bildir. GTD haqiqiy shaxs/kompaniya rekvizitlarini public demo, kod, log, test fixture yoki javobga ko'chirma.

Hozir faqat bitta hujjat yarat: docs/TASK.md. Qisqa bo'limlar: maqsad/scope, manbalar, input-output, tekshirilgan va noaniq qoidalar, missing-data usuli, maxfiy fayllar, acceptance criteria, bosqichlar. Keraksiz README/ADR/changelog/test/config yoki kod yaratma. references va private source fayllarni .gitignore'da himoya qil; mavjud ignore qoidalarini saqla. Git status/diffni tekshir, o'zbekcha natijani qisqa ber va shu yerda to'xta.
~~~

## 2. Stackni o'rnatish va loyiha asosi

~~~text
docs/TASK.md va mavjud repo sozlamalarini tekshir. Faqat loyiha asosini to'ldir. Repo allaqachon Vite React TypeScript ESLint scaffold; qayta create vite qilma, mos configni ustidan yozma. Stack: React + TS strict + Vite + Tailwind CSS 4 + shadcn/ui Radix + RHF + Zod + TanStack Query + decimal.js + ESLint + Prettier + Vitest/Testing Library. Npm va bitta lockfile.

- Vite orqali Tailwind v4 pluginini sozla. Eski Tailwind v3 configni ko'chirma.
- shadcn CLI'ni existing Vite projectga qo'sh. Hozir faqat button, input, label, card, table, select, dialog/command kabi keraklisini; ishlatishdan oldin komponent qo'shma.
- @ aliasni TypeScript va Viteda bir xil ishlat. Vite template tsconfig references saqlansin.
- RHF, @hookform/resolvers, zod, TanStack Query, decimal.js va lucide-react o'rnat; mavjud bo'lsa qayta o'rnatma.
- ESLint configini saqla. Lint script yagona tanlangan ESLint bo'lsin. Oxlint config/package mavjud bo'lsa tekshir, kerak bo'lmasa olib tashla; formatter sifatida Prettier. Lint configni ortiqcha plugin va qoidalar bilan to'ldirma.
- QueryClient providerini bir marta rootda o'rnat. Global store hozir qo'shma. Bir sahifada form state RHF, server/async state Query, kichik UI state React useState.
- Minimal ruscha sahifa va package scripts (dev, build, preview, typecheck, lint, format, test)ni tayyorla. ESLintdan kelgan mavjud scriptsni saqla/izchil o'zgartir.
- references/private, xom PDF/XLSX/XML/ZIP public bundle/repo'ga kirmasin. .gitignore va Vite public katalogini tekshir.
- Faol API yo'q: fake server yaratma. Input uchun generic API layer, DI container, factories, empty folders, barrels yaratma.

SOLID: kalkulyator UI formulaga bog'liq bo'lmasin; domain sof TypeScript; data access UI'dan ajralsin. Hozir 2-3 aniq chegaradan oshirma. Yangi fayl yaratishdan oldin nima uchun kerakligini va mavjud faylga qo'shib bo'lmasligini ko'rsat. npm install, lint, typecheck va production buildni bajargin. Yozilmagan test o'tdi demagin. Yangi/o'zgargan fayllar va tekshiruv natijalarini yoz, to'xta.
~~~

## 3. Katalog va local repository

~~~text
docs/TASK.mdni o'qi. Faqat product catalog va data accessni amalga oshir; form UI/calculator engine'ga tegma.

XLSX'dagi HS kodlarini string saqla va bosh nollarni yo'qotma. Xom XLSX'ni browser yoki public'ga qo'shma. Katalogni qayta yaratish kerak bo'lsa, bitta build-time conversion script yetarlimi deb avval bahola; ortiqcha parser, ETL yoki CLI qo'shma. Bo'sh qatorlar, takroriy kodlar va yozuvlar sonini tekshir; dublikatni jim birlashtirma.

TanStack Query'ni katalog async loaderi va kelajak API adapteri bilan ishlat. Native fetch yetarli; Axios qo'shma. Search HS kod prefiksi va tavsif bo'yicha qidirsin. 13 ming yozuvni har renderda filtrlama yoki birdan DOM'ga chizma; qayta foydalaniladigan indeks yarat va natijani limitla.

Katalogdagi kod tarif topilganini anglatmaydi. Missing rate, source'dan tasdiqlangan zero rate va qo'lda kiritilgan rate holatlarini alohida ko'rsat. Mamlakat/rate mapping source'da yo'q bo'lsa, o'ylab topma. API endpoint berilmagan bo'lsa, fake server yoki delay yaratma.

GTD'dan code, address, taxpayer, bank, ID, XML yoki deklaratsiya summalarini public JSON/fixture/console'ga ko'chirma. Synthetic demo kerak bo'lsa, o'ylab topilgan 2-3 yozuvdan foydalan.

Avval mavjud data/service fayllarni kengaytir. Faqat haqiqiy ehtiyoj bo'lsa conversion script, JSON export, repository yoki test fayli yarat. Qo'shimcha folder, types index, README yoki arxitektura hujjati yaratma. Leading zero, dublikat va missing rate holatlarini tekshir. Yangi fayllarni nima uchun kerakligi bilan sanab, hisoblash bosqichiga o'tma.
~~~

## 4. Hisoblash qoidalari va testlar

~~~text
docs/TASK.md, product catalog modeli va tekshirilgan manbalarni o‘qi. Endi React yoki UI’ga bog‘liq bo‘lmagan hisoblash engine yoz.

Fayllarni faqat vazifaga qarab ajrat: hisoblash input modeli/schema’si, hisoblash funksiyalari va kerak bo‘lsa test. Har bir funksiya uchun alohida fayl yaratma.

Talablar:
1. Zod bilan inputlarni tekshir. Pul va kurs decimal string bo‘lsin. Bo‘sh qiymat, haqiqiy nol, yaroqsiz format va missing rate alohida holatlar.
2. Pul arifmetikasida decimal.js ishlat; pulni hisoblash zanjirida Number’ga aylantirma. Yaxlitlash siyosatini bitta joyda belgila.
3. Bojxona qiymati bilan invoice summasini bitta qiymat deb qabul qilma. Birinchi versiyada bojxona qiymati bevosita kiritiladi. Valyuta kursining sanasi va qaysi birlikka tegishliligini aniq belgila.
4. Foizli, birlik bo‘yicha va manbada tasdiqlangan kombinatsiyali tarifni qo‘llab-quvvatla. Kombinatsiya turi MAX yoki SUM ekanini manba tasdiqlamasa, natijani unsupported/missing input deb qaytar.
5. Har bir to‘lov bazasi, stavka, summa, source va statusni qaytarsin. Holatlar: calculated, zero, not-applicable, missing-input, unsupported. To‘liq bo‘lmagan hisobni yakuniy jami deb ko‘rsatma.
6. QQS bazasi, aksiz, qo‘shimcha boj, mamlakat/sertifikat/sana bo‘yicha policy, rasmiylashtirish va utilizatsiya yig‘imini faqat manbada tasdiqlangan qoidalar bo‘yicha hisobla. Rasmiylashtirish yig‘imi butun jo‘natmaga bir marta tegishli bo‘lsa, har mahsulotga takrorlama.
7. Policy tanlashni pul arifmetikasidan ajrat, lekin ortiqcha service/factory qatlamlari yaratma.
8. Hisoblash kodi React, TanStack Query, DOM, localStorage va network’dan mustaqil bo‘lsin. Keyinchalik UI va PDF ayni engine natijasidan foydalansin.

Ma’noli testlar yoz: qo‘lda hisoblangan foizli misol, nol va missing rate farqi, decimal yaxlitlash, per-unit, bir nechta tovar va jo‘natma yig‘imi bir marta, noto‘g‘ri schema, tasdiqlanmagan kombinatsiya. Test kutilgan summasini ayni engine funksiyasidan chiqarma. Qonuniy chegara testini manba aniq tasdiqlasagina qo‘sh.

Haqiqiy GTD qiymatlarini public test/fixture’ga ko‘chirma. Test, typecheck va lintni ishga tushir. Noaniq qoidalarni ayt, keyingi bosqichga o‘tma.
~~~

## 5. Ko‘p tovarli kalkulyator sahifasi

~~~text
docs/TASK.md, katalog repository’si va hisoblash engine’ni o‘qi. Endi faqat kalkulyator UI’ni qur.

Stack: React + TypeScript, Tailwind CSS 4, shadcn/ui Radix, React Hook Form + zodResolver, TanStack Query, decimal.js. Mavjud komponentlarni qayta ishlat; hozir kerak bo‘lmagan shadcn registry komponentlarini qo‘shma. Ruscha matnlar bilan ishchi kalkulyator yarat: aniq sarlavha, o‘qiladigan inputlar va raqamlar ustunlari. Landing, reklama bloklari, keraksiz grafik/animatsiya kerak emas.

Arxitektura va state:
- Faol input va tovar qatorlarining yagona egasi React Hook Form. Ko‘p tovar uchun useFieldArray ishlat; har qatorga barqaror ID ber.
- Katalog va keyinchalik API ma’lumotlari TanStack Query’da. Query cache’ni boshqa storega nusxalama.
- Bitta sahifali loyiha uchun Zustand/Redux qo‘shma. Modal yoki ochiq qator kabi kichik UI holati React useState’da qoladi.
- Hisoblash formulalarini komponentlarda qayta yozma. Validatsiya qilingan form snapshot’ini domain engine’ga uzat.
- Input o‘zgarsa eski hisob natijasi yangidek ko‘rinmasin: qayta hisobla yoki natija eskirganini belgilab eksportni blokla.
- 2–10 mahsulot jadvaliga shadcn Table yetarli. TanStack Table’ni faqat haqiqiy sorting/pagination talabi bo‘lsa qo‘sh. Saralash bo‘lsa update/delete barqaror ID orqali ishlasin.

Sahifada jo‘natma sanasi, valuta/kurs, HS kodi yoki tavsif bo‘yicha qidiruv, mahsulot qo‘shish/tahrirlash/nusxalash/o‘chirish, miqdor/qiymat va manbalarda tasdiqlangan tovar maydonlari, qo‘lda kiritilgan stavka belgisi, har tovar bo‘yicha to‘lov tafsiloti, faqat to‘liq hisob bo‘lganda yakuniy jami ko‘rinsin. Katalog loading/error/empty, validation, missing rate va partial result holatlarini ko‘rsat. Demo faqat synthetic ma’lumotdan foydalansin.

Desktop va 390px mobil kenglikda asosiy oqimni tekshir. Har input uchun alohida komponent/fayl, empty folder yoki umumiy UI wrapper yaratma. Yangi fayllarning har biri aniq vazifani bajarsin. Build, typecheck, lint va muhim interaction testlarini bajar; amalda tekshirmagan brauzer natijasini o‘ylab topma. Yakunida fayllarni sanab, to‘xta.
~~~

## 6. PDF hisobot eksporti

~~~text
Mavjud calculation result modelini va interfeysni o‘qi. Endi hisob natijasini PDF qilib yuklab olishni qo‘sh.

React versiyasi bilan mos @react-pdf/renderer versiyasini faqat shu bosqichda rasmiy hujjat bilan tekshirib o‘rnat. UI yoki PDF ichida hisoblash formulalarini qayta yozma: PDF tasdiqlangan, eskirmagan calculation snapshot’dan yaratiladi. Majburiy input/stavka yetishmasa yakuniy hisobotni eksport qilma yoki draft deb aniq belgilash siyosatini docs/TASK.md bilan kelishtir.

PDF’da hisob sanasi, valuta va kurs, har bir tovarning kodi/tavsifi/qiymati/miqdori, to‘lov bazasi/stavkasi/manbasi/summasi, tovar subtotal’i, bir martalik jo‘natma yig‘imi va jami bo‘lsin. Qo‘lda/synthetic stavka aniq belgilansin. Ruscha Cyrillic uchun foydalanish huquqi mos font embed qil va ko‘p sahifali jadvalni tekshir.

Kamida 1 va 10+ mahsulotli synthetic PDF yaratib, fayl ochilishini, Cyrillic matn, sahifa bo‘linishi, raqam aniqligi va jami engine natijasi bilan tengligini tekshir. Haqiqiy GTD’ni fixture qilma. Faqat kerakli PDF kodi, font va mazmunli testni qo‘sh; ortiqcha export abstraksiyasi yaratma. Build/typecheck va qisqa o‘zbekcha hisobot ber, keyingi bosqichga o‘tma.
~~~

## 7. Ixtiyoriy: berilgan XML namunasi uchun import

~~~text
Kalkulyator va PDF ishlayotgan bo‘lsa, faqat berilgan GTD XML namunasi uchun cheklangan import yoz. Avval XML root/tag’larni PDF va topshiriq manbasi bilan solishtir; tag ma’nosini nomidan taxmin qilma. Mapping natijasini mavjud docs/TASK.md’ga kirit; ikkinchi arxitektura hujjatini yaratma.

XML’ni browser DOMParser orqali o‘qi. Fayl hajmini chekla; parsererror, noto‘g‘ri root va schema’ni tekshir. DTD/external entity’ni rad et. XML ichidagi HTML/script’ni render yoki execute qilma. Ajratilgan ma’lumotni Zod bilan tekshir. Tovar kodi bir xil bo‘lgan alohida pozitsiyalarni birlashtirma.

Importdan avval preview ko‘rsat: tovarlar, qiymatlar, valuta/kurs va yetishmayotgan maydonlar. Foydalanuvchi tasdiqlagach formaga import qil; cancel joriy hisobni saqlasin. XML ichidagi eski jami hisob engine natijasi emas, faqat manbadagi reference. Missing stavka yoki kursni o‘ylab topma. Faylni serverga yuborma.

Topshiriq talab qilmasa ZIP/base64 yuklash, OCR yoki XML export qo‘shma. Synthetic XML fixture bilan muvaffaqiyatli import, buzilgan XML, qo‘llanmaydigan root, missing input va takroriy tovar qatorlarini tekshir. Haqiqiy GTD yoki rekvizitlarni test/git/loglarga kiritma. Faqat zarur importer va test fayllarini yarat. Qo‘llab-quvvatlanadigan formatni aytib, to‘xta.
~~~

## 8. Yakuniy tekshiruv va Vercelga tayyorlash

~~~text
Repository, docs/TASK.md va git diff’ni ko‘rib chiq. Yangi feature qo‘shma; mavjud ishni yakuniy tekshir.

Typecheck, lint, mazmunli testlar va production buildni bajar. Natijani aynan terminal ko‘rsatganidek qayd et. Production preview’da katalog qidiruvi, bir nechta tovar, manual stavka belgisi, noto‘g‘ri input, missing stavka, qayta hisoblash, bir martalik yig‘im, demo, PDF hamda XML bosqichi bajarilgan bo‘lsa preview/confirm/cancel oqimini tekshir. 390px mobil va desktop layoutni ko‘r. Brauzer tekshiruvi imkoni bo‘lmasa, amalga oshirilmaganini yoz.

Hisob formulasi yagona engine’dan chiqsin. Eski snapshot va to‘liq bo‘lmagan hisob yakuniy jami yoki PDFga aylanmasin. Raw XLSX/PDF/ZIP/XML/HTML, maxfiy rekvizit, STIR, manzil, bank ma’lumoti, credential, log va private fixture repo yoki dist ichiga tushmaganini tekshir. Fayllarni o‘chirib muammoni yashirma.

README yo‘q bo‘lsa faqat bitta qisqa README.md yarat; mavjud bo‘lsa yangila. Stack, ishga tushirish/test/build, data flow, stavkalar cheklovi, API adapter va Vercel deploy qadamlarini yoz. Qo‘shimcha docs/architecture/ADR/changelog yaratma. Vercel SPA sozlamasini faqat router kerak bo‘lsa qo‘sh. GitHub’ga push yoki deployni men alohida so‘ramagunimcha bajarma.

Yakunida: o‘zgargan/yangi fayllar va nima uchun kerakligi, tekshiruv natijalari, qolgan cheklovlar, Vercel deploy qadamlari, 2 daqiqalik demo ketma-ketligi va SOLID bo‘yicha tushuntira oladigan 3 qarorni o‘zbekcha sanab ber.
~~~


## Rasmiy setup manbalari

- [Vite](https://vite.dev/guide/)
- [Tailwind CSS 4 + Vite](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui Vite](https://ui.shadcn.com/docs/installation/vite)
- [React Hook Form](https://react-hook-form.com/docs/usefieldarray)
- [Zod resolver](https://github.com/react-hook-form/resolvers)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [decimal.js](https://github.com/MikeMcl/decimal.js)
- [ESLint](https://eslint.org/docs/latest/)
- [Vitest](https://vitest.dev/guide/)
- [React PDF](https://react-pdf.org/)

Codex o'rnatilgan versiya va lockfile'ga mos hujjatlarni tekshirsin.
