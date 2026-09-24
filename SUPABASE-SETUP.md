# ABR Gadgets — Real Database Setup (Supabase)

Ye poora guide hai taake local/demo mode se **real, production-ready database**
pe switch ho sake. Ek dafa ye ho gaya to sab customers/devices ka data
hamesha ek hi jagah (Supabase cloud) save hoga.

## Step 1 — Supabase Project

1. https://supabase.com par login karo (aapka pehle se account/project hai —
   "waqas0324-dev's Project" — wahi use kar sakte ho, ya naya bana lo)
2. Project open karo, thoda wait karo (agar naya bana rahe ho)

## Step 2 — Database Schema banao

1. Left sidebar me **"SQL Editor"** pe jao
2. **"New query"** pe click karo
3. Is project ke `supabase/migrations/001_full_schema.sql` file ko kholo, poora
   content copy karo, SQL Editor me paste karo, **"Run"** dabao
4. Confirm "Success" dikhna chahiye — ye sab tables (products, categories,
   orders, order_items, reviews, admin_users) aur security rules bana dega

## Step 3 — Starter Products/Categories dalo (optional)

1. Naya query kholo, `supabase/migrations/002_seed_data.sql` ka content
   paste karo, **"Run"** dabao
2. Ye 8 categories aur 8 demo products dal dega — baad me admin panel se
   inhe edit/delete/replace kar sakte ho apni asli products se

## Step 4 — Product Images ke liye Storage Bucket

Agar Step 2 ka SQL properly chala hai to bucket khud ban gaya hoga. Confirm
karne ke liye:
1. Left sidebar me **"Storage"** pe jao
2. **"product-images"** naam ka bucket dikhna chahiye
3. Agar nahi dikh raha, khud bana lo: **"New bucket"** → naam `product-images`
   → **"Public bucket"** ON karo → Save

## Step 5 — Admin Login User banao

Ye zaroori hai — is ke bina admin panel me login nahi hoga.

1. Left sidebar me **"Authentication"** → **"Users"** pe jao
2. **"Add user"** → **"Create new user"** pe click karo
3. Email: `owner@abrgadgets.pk` (ya jo bhi aap rakhna chahain)
4. Password: `AbrGadgets2026` (ya jo bhi aap rakhna chahain)
5. **"Auto Confirm User"** ka toggle ON karo (zaroori hai, warna login nahi hoga)
6. **"Create user"** dabao

Ab SQL Editor me ye chalao (apni email daal kar) taake wo email admin
whitelist me bhi aa jaye:

```sql
insert into admin_users (email) values ('owner@abrgadgets.pk');
```

## Step 6 — API Keys nikalo

1. Left sidebar me **"Project Settings"** (gear icon) → **"API Keys"**
2. Ye 2 cheezein copy karo:
   - **Project URL** (kuch aisa: `https://xxxxx.supabase.co`)
   - **Publishable/anon key** (lambi string, "default" ke aage)

## Step 7 — Apni website ko ye keys batao

**Local computer pe test karne ke liye:**
1. Project folder me `.env.example` file ko copy karke `.env` naam se save karo
2. `.env` file kholo, apni real URL/key daal do:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
   ```
3. `npm install` phir `npm run dev`

**Vercel pe live karte waqt:**
1. Vercel project → **Settings** → **Environment Variables**
2. Same 2 variables add karo: `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY`
3. Redeploy karo

## Bas, ho gaya!

Ab website **real database** use kar rahi hai:
- Koi bhi customer, kisi bhi phone/computer se order kare — order aapke
  admin panel me nazar aayega
- Product photos ab Supabase Storage me save hongi (localStorage limit ka
  masla khatam)
- Data kabhi "gayab" nahi hoga, browser cache clear karne se bhi nahi

Agar kisi step pe atken, screenshot bhej dena.

## Extra Step — Developer Studio (sirf aapke liye, chhupa hua)

Ye ek ALAG, chhupa hua panel hai jahan sirf AAP (client nahi) ja kar
website ka logo, hero image/text, aur trust-checklist edit kar sakte
hain — **koi deploy nahi chahiye**, turant live ho jata hai.

**Access:** website ke URL ke end me `#ws-studio` likho
(e.g. `https://aapki-site.vercel.app/#ws-studio`)

**Login banane ka tareeqa** (bilkul Step 5 jaisa, lekin alag email se):
1. Supabase → Authentication → Users → "Add user" → "Create new user"
2. Email: `waqas@abrgadgets-studio.pk`
3. Password: jo bhi chahen
4. "Auto Confirm User" ON karo → "Create user"

Ye email already `developer_users` table me whitelist ho chuki hai — bas
Auth user banana baaki hai.

**Zaroori:** Ye email `admin_users` table me nahi hai, is liye client ka
admin login (`owner@abrgadgets.pk`) is Developer Studio me kaam nahi
karega — bilkul jaisa chahiye tha.
