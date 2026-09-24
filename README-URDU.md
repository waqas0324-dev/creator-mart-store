# ABR Gadgets — Real Production E-commerce Store

## ⚠️ Zaroori — Pehle ye karo
Is version me **real Supabase database** use hoti hai (local/demo mode nahi).
Chalane se pehle **SUPABASE-SETUP.md** file zaroor follow karo — usme
step-by-step database setup hai. Us ke bina website blank/error dikhayegi.

## Kaise chalayen (Supabase setup ke baad)
1. Terminal is folder ke andar kholo
2. `npm install`
3. `npm run dev`
4. Jo link mile (`http://localhost:5173`) browser me kholo

## Admin Panel
- URL: `http://localhost:5173/#admin-login`
- Email/Password: jo aap ne Supabase Authentication me banaya tha
  (SUPABASE-SETUP.md ke Step 5 me)

## Live/Deploy karna (Vercel)
1. GitHub par is code ka repository banao
2. vercel.com par login karo → "Add New" → "Project" → apni repo select karo
3. **Zaroori:** Deploy se pehle Vercel Settings → Environment Variables me
   `VITE_SUPABASE_URL` aur `VITE_SUPABASE_ANON_KEY` add karo (SUPABASE-SETUP.md
   Step 6-7 dekho)
4. "Deploy" dabao — 1-2 minute me live link mil jayega

## Product Photos
Naye products/categories ke liye jo photo admin panel se upload karoge, wo
ab Supabase Storage me save hogi — koi browser limit ka masla nahi.

## Purani Local/Demo Version
Agar kabhi purani "browser-only" demo version ka code dekhna ho (bina
Supabase ke), wo `local-demo-mode-backup/` folder me mehfooz hai — istemal
ke liye nahi, sirf reference ke liye.

## SEO
robots.txt aur sitemap.xml already lag chuke hain. **Jab aapka asli domain
mil jaye** (e.g. abrgadgets.pk ya abrgadgets.vercel.app), `public/sitemap.xml`
aur `public/robots.txt` me jo abhi `abrgadgets.pk` likha hai, use apne asli
domain se badal dena.

## Speed Optimization (already done)
- Admin panel ka code sirf tabhi load hota hai jab koi `/#admin-login` khole
  — customer ke liye website hamesha chhoti/tez rehti hai
- Product images "lazy load" hoti hain (jo screen pe nazar aaye, tabhi load ho)
- Logo files 270KB se 31KB tak compress ki gayi hain
- Total customer-facing size ~118KB (gzip) — 3G pe bhi 2-3 second se kam me load hogi
