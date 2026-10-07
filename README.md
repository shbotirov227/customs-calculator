# O'zbekiston import bojxona kalkulyatori

React, TypeScript va Vite asosidagi take-home demo. Ilova lokal HS katalogidan qidiradi, bir nechta tovar uchun ma'lum to'lov qismlarini hisoblaydi, GTD XML namunasini preview orqali import qiladi va faqat to'liq hamda eskirmagan hisob snapshotidan PDF yaratadi.

## Ishga tushirish

Node.js va npm o'rnatilgan bo'lishi kerak.

```bash
npm install
npm run dev
```

Asosiy tekshiruvlar:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run preview
```

`npm run catalog:build` faqat private `references/КОДЫ-НОВЫЕ.xlsx` manbasidan lokal katalogni qayta yaratish zarur bo'lganda ishlatiladi. Xom manba browser bundle'iga ko'chirilmaydi.

## Data flow

- Forma va tovar qatorlari React Hook Form hamda `useFieldArray`da saqlanadi.
- Lokal katalog dinamik import qilinadi; qidiruv va cache TanStack Query orqali boshqariladi. Hozir tashqi API yo'q, katalog loaderi kelajakdagi API adapteri uchun minimal chegara vazifasini bajaradi.
- Validatsiyadan o'tgan snapshot sof TypeScript calculation engine'iga uzatiladi. Pul arifmetikasi `decimal.js` bilan bajariladi.
- PDF formulalarni takrorlamaydi; engine qaytargan to'liq va eskirmagan snapshotdan yaratiladi.
- GTD XML browserda lokal o'qiladi. Import faqat tasdiqlangan HS kodi va tavsif mappingini preview hamda foydalanuvchi tasdig'idan keyin formaga qo'llaydi.

## Demo cheklovlari

- HS katalogida boj, QQS yoki aksiz stavkalari yo'q. Katalogdagi kod stavka topilganini anglatmaydi.
- Bazaviy tariflar, QQS, aksiz, ayrim yig'imlar, valuta kursi policy'si va kombinatsiyali tarif qoidalari uchun to'liq tasdiqlangan manbalar berilmagan.
- Topilmagan stavka `0` hisoblanmaydi. Qo'lda kiritilgan stavka tasdiqlangan manbadan alohida belgilanadi.
- Yetishmayotgan yoki qo'llab-quvvatlanmaydigan qoida bo'lsa yakuniy jami va final PDF eksporti bloklanadi.
- Natijalar real bojxona deklaratsiyasi yoki yuridik xulosa emas; bu source-cheklangan demo.
- XML import faqat `GTD_eCopy_DefEdFormat` namunasi uchun. ZIP, `eDataXML`, qiymat, miqdor, valuta, kurs va boj stavkalari import qilinmaydi.
- `references/`, xom PDF/XLSX/XML/ZIP va real GTD rekvizitlari Git hamda production builddan chiqarilgan.

Huquqiy va missing-data tafsilotlari [docs/TASK.md](docs/TASK.md)da qayd etilgan.

## Vercelga joylashtirish

Loyihada router yo'q va barcha UI bitta root sahifada ishlaydi, shuning uchun `vercel.json` yoki SPA rewrite kerak emas.

1. Repository'ni Git provayderiga joylashtirgandan keyin Vercel Dashboard'da **Add New → Project** orqali import qiling.
2. Framework preset sifatida **Vite** tanlanganini tekshiring.
3. Install command uchun `npm install`, build command uchun `npm run build`, output directory uchun `dist` ishlating.
4. Environment variable talab qilinmaydi. Deploydan oldin test, typecheck, lint va buildni lokal bajaring.
5. Deploydan keyin katalog qidiruvi, incomplete/stale bloklari, XML preview/cancel/confirm va mobil/desktop layoutni smoke-test qiling.

Bu repository'dan avtomatik deploy yoki push bajarilmaydi.
