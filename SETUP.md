# دليل إعداد المشروع - nafsschool

## المتطلبات الأساسية
- Node.js (v18 أو أحدث)
- npm أو bun
- حساب Supabase

## خطوات الإعداد

### 1. استنساخ المشروع
```bash
git clone https://github.com/iblwz18s/nafsschool.git
cd nafsschool
```

### 2. تثبيت الاعتماديات
```bash
npm install
# أو
bun install
```

### 3. إعداد المتغيرات البيئية

#### أ. نسخ ملف المثال
```bash
cp .env.example .env
```

#### ب. الحصول على بيانات Supabase
1. سجّل الدخول إلى [لوحة تحكم Supabase](https://app.supabase.com)
2. افتح مشروعك أو أنشئ مشروعًا جديدًا
3. اذهب إلى: **Settings** → **API**
4. انسخ القيم التالية:
   - **Project ID**: من رابط المشروع
   - **Project URL**: من قسم "Project URL"
   - **anon/public key**: من قسم "Project API keys"

#### ج. تحديث ملف .env
افتح ملف `.env` وأضف القيم التي حصلت عليها:

```env
VITE_SUPABASE_PROJECT_ID=your_actual_project_id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_actual_anon_key
```

### 4. إعداد قاعدة البيانات

قم بتشغيل الهجرات (migrations) الموجودة في مجلد `supabase/migrations` من لوحة تحكم Supabase:
1. اذهب إلى **SQL Editor** في لوحة تحكم Supabase
2. قم بتشغيل ملفات الهجرة بالترتيب

### 5. تشغيل المشروع

```bash
npm run dev
# أو
bun run dev
```

سيعمل المشروع على: `http://localhost:5173`

## استكشاف الأخطاء

### خطأ في الاتصال بـ Supabase
- تأكد من صحة القيم في ملف `.env`
- تأكد من أن المشروع نشط في Supabase
- تحقق من أن المفاتيح لم تنتهي صلاحيتها

### خطأ في قاعدة البيانات
- تأكد من تشغيل جميع الهجرات (migrations)
- تحقق من صلاحيات الوصول في Supabase

## الاستضافة على Vercel

عند الاستضافة على Vercel، تأكد من إضافة المتغيرات البيئية في:
**Project Settings** → **Environment Variables**

أضف نفس المتغيرات الموجودة في ملف `.env`:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
