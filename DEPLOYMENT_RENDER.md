# Render Platformasida 1 Dona Web Service Orqali Ishga Tushirish Qo'llanmasi

Ushbu qo'llanma **Mars IT (NF-3043)** platformasini Render bulut platformasida **1 dona Web Service** va **1 dona Managed PostgreSQL** orqali to'liq ishga tushirish qadamlarini batafsil tushuntiradi.

---

## 1-Qadam: Render'da PostgreSQL Ma'lumotlar Bazasini Yaratish

1. [dashboard.render.com](https://dashboard.render.com) saytiga kiring.
2. Yuqori o'ng burchakdagi **"New +"** tugmasini bosing va **"PostgreSQL"** ni tanlang.
3. Quyidagi parametrlarni to'ldiring:
   - **Name:** `mars-it-postgres`
   - **Database:** `mars_db`
   - **User:** `mars_user`
   - **Region:** Frankfurt (EU Central) yoki Oregon (US West)
   - **Instance Type:** `Free` (bepul) yoki `Starter`
4. **"Create Database"** tugmasini bosing.
5. Baza yaratilgach, sahifaning pastrog'idagi **"Connections"** bo'limiga tushing va **"External Database URL"** ni nusxalab oling (unda `?sslmode=require` bo'lishi shart).
   - Misol: `postgres://mars_user:parol@dpg-xxxxxx.frankfurt-postgres.render.com/mars_db?sslmode=require`

---

## 2-Qadam: Render'da 1 Dona Web Service Yaratish

1. Render Dashboard'ga qaytib, **"New +"** $\rightarrow$ **"Web Service"** ni tanlang.
2. Loyihangiz joylashgan **GitHub / GitLab omborini** (Repository) ulang.
3. Quyidagi asosiy sozlamalarni kiriting:
   - **Name:** `mars-it-platform`
   - **Region:** PostgreSQL bilan bir xil regionni tanlang (masalan, Frankfurt).
   - **Branch:** `main`
   - **Root Directory:** (bo'sh qoldiring, ya'ni ildiz papka)
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Instance Type:** `Free` (bepul) yoki `Starter`

---

## 3-Qadam: Muhit O'zgaruvchilari (Environment Variables) Kiritish

O'sha Web Service sozlamalaridagi **"Environment Variables"** bo'limiga quyidagi o'zgaruvchilarni qo'shing:

| Kalit (Key) | Qiymat (Value) | Izoh |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Ishlab chiqarish tezligi va xavfsizlik rejimi |
| `DATABASE_URL` | *1-qadamda nusxalangan External Database URL* | Render PostgreSQL tashqi SSL ulanish ssilkasi |
| `JWT_SECRET` | `mars-it-secret-jwt-key-2024-secure-production-random` | Sessiya va tokenlar uchun 64+ belgili maxfiy so'z |
| `ADMIN_INITIAL_PASSWORD` | `admin123` | Baza birinchi marta ochilganda admin hisobi uchun parol |

*(Ixtiyoriy: Agar kelgusida rasmlar uchun Cloudflare R2 ishlatmoqchi bo'lsangiz, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` kalitlarini ham shu yerga qo'shasiz. Agar kiritmasangiz, tizim avtomatik lokal server omborida ishlayveradi).*

4. Pastdagi **"Create Web Service"** tugmasini bosing.

---

## 4-Qadam: Avtomatik Ishga Tushish va Boshqaruv

1. Render loyihani avtomatik yuklaydi, `npm install` va `npm run build` ni amalga oshiradi.
2. Server ishga tushganda:
   - Barcha jadvallar (`users`, `submissions`, `review_comments`, `notifications`) **avtomatik yaratiladi** (qo'shimcha SQL skript yurgizish shart emas!).
   - Boshlang'ich Admin hisobi avtomatik ochiladi:
     - **Login:** `admin`
     - **Parol:** `admin123`
3. Render sizga bepul domen beradi (masalan: `https://mars-it-platform.onrender.com`).

---

## 5-Qadam: O'qituvchi va Talabalar Ish Jarayoni

1. **O'qituvchi (Admin):**
   - Saytga kirib `/login` sahifasiga o'tadi (`admin` / `admin123`).
   - `/admin/students` sahifasiga kirib, o'quvchilariga hisob ochadi (masalan, `islom_dev`, `anvar_bek`) va parollarni ularga beradi.
   - `/admin` panelida o'tiradi — talabalar rasm yuklashi bilan **sahifani yangilamasdan (SSE orqali)** ekranda yangi yuklama va bildirishnoma ko'rinadi.
   - O'qituvchi kod rasmini ochib, kamchiligini yozadi va **"To'g'ri / Xato / Qayta topshirish"** tugmasini bosadi.

2. **Talaba (Student):**
   - O'qituvchi bergan login va parol orqali `/login` sahifasidan kiradi.
   - Kompyuter ekrani yoki daftardagi kod suratini yuklaydi.
   - Faqat o'zining topshiriqlari va o'qituvchi unga yozgan fikrlarni ko'radi. Boshqa talabalar ma'lumotlari mutlaqo ko'rinmaydi.
