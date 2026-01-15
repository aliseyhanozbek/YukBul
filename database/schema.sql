-- Users Table
-- Note: id is UUID from auth.users, not auto-increment
-- Password is stored in auth.users, not in this table for security
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL CHECK ("role" IN ('musteri', 'sofor')),
  "address" TEXT,
  "bio" TEXT,
  "vehicle" TEXT,
  "plate" TEXT,
  "rating" DECIMAL(3,2) DEFAULT 0,
  "reviews" INTEGER DEFAULT 0,
  "totalShipments" INTEGER DEFAULT 0,
  "totalSpent" TEXT DEFAULT '₺0',
  "avgRating" DECIMAL(3,2) DEFAULT 0,
  "memberSince" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;

-- Listings Table
CREATE TABLE "listings" (
  "id" BIGSERIAL PRIMARY KEY,
  "driverId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "capacity" TEXT NOT NULL,
  "vehicleType" TEXT,
  "price" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT DEFAULT 'Aktif' CHECK ("status" IN ('Aktif', 'Beklemede', 'Tamamlandı', 'İptal')),
  "views" INTEGER DEFAULT 0,
  "messages" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "listings" DISABLE ROW LEVEL SECURITY;

-- Orders Table
CREATE TABLE "orders" (
  "id" BIGSERIAL PRIMARY KEY,
  "customerId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "driverId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "listingId" BIGINT REFERENCES "listings"("id") ON DELETE SET NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "cargo" TEXT,
  "vehicleType" TEXT,
  "price" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('Onay Bekliyor', 'Hazırlanıyor', 'Yolda', 'Tamamlandı', 'İptal')),
  "progress" INTEGER DEFAULT 0,
  "eta" TEXT,
  "completedAt" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;

-- Conversations Table
CREATE TABLE "conversations" (
  "id" BIGSERIAL PRIMARY KEY,
  "customerId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "driverId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "listingId" BIGINT REFERENCES "listings"("id") ON DELETE SET NULL,
  "lastMessage" TEXT,
  "time" TEXT,
  "unread" INTEGER DEFAULT 0,
  "online" BOOLEAN DEFAULT false,
  "route" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "conversations" DISABLE ROW LEVEL SECURITY;

-- Messages Table
CREATE TABLE "messages" (
  "id" BIGSERIAL PRIMARY KEY,
  "conversationId" BIGINT REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender" TEXT NOT NULL CHECK ("sender" IN ('customer', 'driver', 'me', 'other')),
  "text" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "read" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;

-- Reviews Table
CREATE TABLE "reviews" (
  "id" BIGSERIAL PRIMARY KEY,
  "customerId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "driverId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "orderId" BIGINT REFERENCES "orders"("id") ON DELETE SET NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment" TEXT,
  "date" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;

-- Shipment Tracking Table
CREATE TABLE "shipmentTracking" (
  "id" BIGSERIAL PRIMARY KEY,
  "orderId" BIGINT REFERENCES "orders"("id") ON DELETE CASCADE,
  "currentLocation" TEXT,
  "lastUpdate" TEXT,
  "from" JSONB,
  "to" JSONB,
  "progress" INTEGER DEFAULT 0,
  "eta" TEXT,
  "vehicleType" TEXT,
  "vehiclePlate" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "shipmentTracking" DISABLE ROW LEVEL SECURITY;

-- Location Sharing Table
CREATE TABLE "locationSharing" (
  "id" BIGSERIAL PRIMARY KEY,
  "driverId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "orderId" BIGINT REFERENCES "orders"("id") ON DELETE CASCADE,
  "latitude" DECIMAL(10,8),
  "longitude" DECIMAL(11,8),
  "isSharing" BOOLEAN DEFAULT false,
  "lastUpdate" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "locationSharing" DISABLE ROW LEVEL SECURITY;

-- Timeline Table
CREATE TABLE "timeline" (
  "id" BIGSERIAL PRIMARY KEY,
  "orderId" BIGINT REFERENCES "orders"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "time" TEXT,
  "completed" BOOLEAN DEFAULT false,
  "current" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "timeline" DISABLE ROW LEVEL SECURITY;

-- Statistics Table (for driver statistics)
CREATE TABLE "statistics" (
  "id" BIGSERIAL PRIMARY KEY,
  "driverId" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "totalKm" INTEGER DEFAULT 0,
  "totalShipments" INTEGER DEFAULT 0,
  "totalIncome" TEXT DEFAULT '₺0',
  "totalExpense" TEXT DEFAULT '₺0',
  "netProfit" TEXT DEFAULT '₺0',
  "month" TEXT,
  "value" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "statistics" DISABLE ROW LEVEL SECURITY;

