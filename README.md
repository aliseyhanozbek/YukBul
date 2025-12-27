# Yük Bul - Kargo Taşıma Platformu

Müşteriler ve şoförlerin buluştuğu kargo taşıma platformu.

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js (v18 veya üzeri önerilir)
- npm veya yarn
- Supabase hesabı ve projesi

### Adım Adım Kurulum

#### 1. Projeyi İndirin

```sh
# GitHub'dan projeyi klonlayın veya indirin
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

#### 2. Bağımlılıkları Yükleyin

```sh
# Tüm paketleri yükleyin (Leaflet ve diğer tüm bağımlılıklar otomatik yüklenecek)
npm install
```

**Not:** Leaflet paketleri (`leaflet`, `react-leaflet`, `@types/leaflet`) zaten `package.json` dosyasında tanımlıdır ve `npm install` komutu ile otomatik olarak yüklenecektir. Ayrıca kurmanıza gerek yoktur.

#### 3. Environment Variables (Çevre Değişkenleri) Ayarlayın ⚠️ **ÇOK ÖNEMLİ!**

**NEDEN GEREKLİ?** `.env.local` dosyası güvenlik nedeniyle GitHub'a yüklenmez. Bu yüzden her yeni kurulumda bu dosyayı manuel oluşturmanız gerekir.

**Proje Supabase kullanmaktadır. Environment variables ayarlamanız gerekmektedir:**

**Yöntem 1: .env.example dosyası varsa (önerilen)**
1. Proje kök dizininde `.env.example` dosyasını `.env.local` olarak kopyalayın:
   ```sh
   # Windows (PowerShell)
   Copy-Item .env.example .env.local
   
   # Mac/Linux
   cp .env.example .env.local
   ```

**Yöntem 2: Manuel oluşturma**
1. Proje kök dizininde `.env.local` adında yeni bir dosya oluşturun (Notepad, VS Code, vb.)
2. Dosyaya şu içeriği ekleyin:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

**ÖNEMLİ KURALLAR:**
- ✅ Değerlerin etrafında **TIRNAK İŞARETİ OLMAMALI**
- ✅ Satır sonunda **BOŞLUK OLMAMALI**
- ✅ Dosya adı tam olarak **`.env.local`** olmalı (`.env.local.txt` değil!)
- ✅ Dosya proje **kök dizininde** olmalı (package.json ile aynı yerde)

**Supabase bilgilerinizi nereden bulabilirsiniz?**
1. [Supabase Dashboard](https://app.supabase.com)'a giriş yapın
2. Projenizi seçin
3. **Settings** > **API** bölümüne gidin
4. **Project URL** değerini kopyalayın → `VITE_SUPABASE_URL` olarak kullanın
5. **anon public** key'i kopyalayın → `VITE_SUPABASE_ANON_KEY` olarak kullanın

**Örnek .env.local dosyası:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTIzNDU2NywiZXhwIjoxOTYwODEwNTY3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 4. Development Server'ı Başlatın

```sh
npm run dev
```

#### 5. Tarayıcıda Açın

Terminal'de şu mesajı göreceksiniz:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

Tarayıcınızda **http://localhost:8080** adresine gidin.

## ⚠️ Önemli Notlar

### Port 8080 Kullanımı

- Proje varsayılan olarak **port 8080**'de çalışır
- Eğer port 8080 kullanımda ise, Vite otomatik olarak bir sonraki boş portu kullanacaktır
- Port değişikliği yapmak isterseniz `vite.config.ts` dosyasındaki `port: 8080` değerini değiştirebilirsiniz

### Environment Variables Kontrolü ⚠️ **KRİTİK!**

- `.env.local` dosyası **mutlaka** oluşturulmalıdır - **olmadan proje çalışmaz!**
- Supabase URL ve Key bilgileri olmadan uygulama başlatıldığında hata verecektir
- `.env.local` dosyası `.gitignore`'da olduğu için GitHub'a yüklenmez (güvenlik için)
- **Her yeni kurulumda bu dosyayı tekrar oluşturmanız gerekir**
- GitHub'dan indirdikten sonra `.env.local` dosyası olmayacaktır - siz oluşturmalısınız!

### Veritabanı Kurulumu

- Supabase projenizde veritabanı şemasını oluşturmanız gerekmektedir
- `supabase_schema.sql` dosyasını Supabase SQL Editor'de çalıştırın
- Migration dosyalarını (`migration_*.sql`) sırasıyla çalıştırın (gerekirse)

### Sorun Giderme

**Port zaten kullanımda hatası:**
```sh
# Port 8080'i kullanan işlemi bulun ve kapatın
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8080 | xargs kill
```

**Environment variables hatası:**
- `.env.local` dosyasının proje kök dizininde olduğundan emin olun
- Dosya adının tam olarak `.env.local` olduğunu kontrol edin (`.env.local.txt` değil)
- Supabase bilgilerinin doğru olduğundan emin olun

**Bağımlılık hataları:**
```sh
# node_modules'ü silip yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
```

## 📦 Kullanılan Teknolojiler

- **Vite** - Build tool ve dev server
- **React** - UI framework
- **TypeScript** - Type safety
- **Supabase** - Backend ve veritabanı
- **React Router** - Routing
- **Leaflet** - Harita görselleştirme
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library

## 📝 Scripts

- `npm run dev` - Development server'ı başlatır (port 8080)
- `npm run build` - Production build oluşturur
- `npm run preview` - Production build'i önizler
- `npm run lint` - ESLint ile kod kontrolü yapar

## 🔧 Geliştirme

Projeyi yerel olarak geliştirmek için:

1. `.env.local` dosyasını oluşturduğunuzdan emin olun
2. `npm run dev` ile development server'ı başlatın
3. Kod değişiklikleri otomatik olarak hot-reload ile yansıyacaktır

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
