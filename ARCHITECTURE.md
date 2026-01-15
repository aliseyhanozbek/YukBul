# 🏗️ Proje Mimarisi

Bu dokümantasyon, Yük Bul projesinin profesyonel katmanlı mimarisini açıklar.

## 📁 Dizin Yapısı

```
src/
├── types/              # TypeScript tip tanımları
│   └── database.types.ts
│
├── lib/                # Kütüphane konfigürasyonları
│   ├── config.ts       # Merkezi konfigürasyon yönetimi
│   └── supabaseClient.ts # Supabase client instance
│
├── services/           # Veritabanı işlemleri (API katmanı)
│   ├── userService.ts
│   ├── listingService.ts
│   ├── orderService.ts
│   ├── conversationService.ts
│   ├── messageService.ts
│   ├── companyService.ts
│   ├── statisticsService.ts
│   ├── locationService.ts
│   ├── reviewService.ts
│   ├── trackingService.ts
│   └── index.ts        # Merkezi export
│
├── hooks/             # Custom React hooks
│   └── useUserProfile.ts
│
├── components/        # UI bileşenleri
│   ├── ui/            # shadcn/ui bileşenleri
│   └── ...
│
├── pages/              # Sayfa bileşenleri
│   ├── musteri/
│   ├── sofor/
│   └── sirket/
│
├── contexts/           # React Context providers
│   └── AuthContext.tsx
│
└── utils/             # Yardımcı fonksiyonlar
    ├── conversationUtils.ts
    └── storageCleanup.ts
```

## 🎯 Mimari Prensipler

### 1. Katmanlı Mimari (Layered Architecture)

Proje, aşağıdaki katmanlara ayrılmıştır:

#### **Types Layer** (`src/types/`)
- Tüm TypeScript tip tanımları
- Supabase database tipleri
- Uygulama genelinde kullanılan interface'ler

#### **Lib Layer** (`src/lib/`)
- **config.ts**: Merkezi konfigürasyon yönetimi
  - Environment variable validasyonu
  - Güvenli config erişimi
- **supabaseClient.ts**: Supabase client instance
  - Tek bir merkezi client
  - Type-safe database erişimi

#### **Services Layer** (`src/services/`)
- **Tüm veritabanı işlemleri burada**
- CRUD operasyonları
- Business logic
- Component'lerden bağımsız
- Her tablo için ayrı service dosyası

#### **Hooks Layer** (`src/hooks/`)
- Services katmanını kullanan custom hooks
- React state yönetimi
- Veri çekme mantığı

#### **Components Layer** (`src/components/` & `src/pages/`)
- Sadece UI mantığı
- Services katmanını kullanır
- Doğrudan Supabase çağrısı YOK

### 2. Separation of Concerns

```
Component → Hook → Service → Supabase Client → Database
```

- **Component**: UI ve kullanıcı etkileşimi
- **Hook**: State yönetimi ve veri çekme
- **Service**: Business logic ve veritabanı işlemleri
- **Client**: Veritabanı bağlantısı

### 3. Güvenlik

- Environment variables merkezi yönetilir (`lib/config.ts`)
- Validasyon ve hata kontrolü her katmanda
- Type-safe işlemler

## 📚 Kullanım Örnekleri

### Service Kullanımı

```typescript
// ❌ YANLIŞ - Component'te doğrudan Supabase çağrısı
const { data } = await supabase.from('listings').select('*');

// ✅ DOĞRU - Service katmanı kullanımı
import { getListings } from '@/services/listingService';
const listings = await getListings({ status: 'Aktif' });
```

### Hook Kullanımı

```typescript
// ✅ Hook içinde service kullanımı
import { getUserById } from '@/services/userService';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await getUserById(userId);
      setProfile(userProfile);
    };
    fetchProfile();
  }, [userId]);
  
  return { profile };
};
```

### Component'te Service Kullanımı

```typescript
// ✅ Component'te service kullanımı
import { createListing } from '@/services/listingService';

const handleSubmit = async () => {
  try {
    await createListing(listingData);
    toast.success('İlan oluşturuldu!');
  } catch (error) {
    toast.error('Hata oluştu');
  }
};
```

## 🔄 Migration Rehberi

Kalan component'leri güncellemek için:

### Adım 1: Import'ları Güncelle

```typescript
// Eski
import { supabase } from '@/lib/supabaseClient';

// Yeni
import { getListings, createListing } from '@/services/listingService';
```

### Adım 2: Supabase Çağrılarını Değiştir

```typescript
// Eski
const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('driverId', userId);

// Yeni
const listings = await getListings({ driverId: userId });
```

### Adım 3: Hata Yönetimi

```typescript
// Eski
if (error) {
  console.error(error);
  return;
}

// Yeni
try {
  const data = await getListings();
} catch (error) {
  console.error(error);
  toast.error('Hata oluştu');
}
```

## 📋 Service Listesi

| Service | Açıklama | Ana Fonksiyonlar |
|---------|----------|------------------|
| `userService` | Kullanıcı işlemleri | `getUserById`, `createUser`, `updateUser` |
| `listingService` | İlan işlemleri | `getListings`, `createListing`, `updateListing` |
| `orderService` | Sipariş işlemleri | `getOrders`, `createOrder`, `updateOrder` |
| `conversationService` | Konuşma işlemleri | `getConversations`, `createConversation` |
| `messageService` | Mesaj işlemleri | `getMessagesByConversationId`, `createMessage` |
| `companyService` | Şirket işlemleri | `getCompanyById`, `createCompany`, `updateCompany` |
| `statisticsService` | İstatistik işlemleri | `getStatisticsByDriverId` |
| `locationService` | Konum paylaşımı | `getLocationByDriverId`, `upsertLocationSharing` |
| `reviewService` | Değerlendirme işlemleri | `getReviewsByDriverId`, `createReview` |
| `trackingService` | Takip işlemleri | `getTrackingByOrderId`, `upsertTracking` |

## ✅ Tamamlanan İşlemler

- ✅ Types katmanı oluşturuldu
- ✅ Config merkezileştirildi
- ✅ Supabase client temizlendi
- ✅ Tüm services oluşturuldu
- ✅ useUserProfile hook güncellendi
- ✅ Örnek component'ler güncellendi (IlanOlustur, MusteriPanel)

## 🔄 Devam Eden İşlemler

- ⏳ Kalan component'lerin services'e taşınması
- ⏳ Import yollarının kontrolü

## 🎓 Best Practices

1. **Component'lerde asla doğrudan Supabase çağrısı yapmayın**
2. **Tüm veritabanı işlemleri services katmanından geçmeli**
3. **Hooks, services'i kullanmalı**
4. **Types'ları her zaman kullanın**
5. **Hata yönetimini unutmayın**

## 📝 Notlar

- Auth işlemleri (`supabase.auth`) doğrudan kullanılabilir (AuthContext'te)
- Real-time subscriptions için Supabase client doğrudan kullanılabilir
- Services katmanı, tüm CRUD işlemlerini kapsar
- Her service dosyası, ilgili tablo için tüm operasyonları içerir

