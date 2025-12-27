import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Truck, Package, TrendingUp, MapPin, Star, Plus, ArrowRight,
  Calendar, Clock, DollarSign, Route
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalListings: number;
  activeOrders: number;
  monthlyEarnings: string;
  avgRating: string;
}

interface RecentListing {
  id: number;
  from: string;
  to: string;
  date: string;
  capacity: string;
  price: string;
}

const SoforPanel = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeOrders: 0,
    monthlyEarnings: "₺0",
    avgRating: "0.0"
  });
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  // Get display name with fallback
  const displayName = profile?.name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Yükleniyor...';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Ensure user.id is a string (UUID)
      if (typeof user.id !== 'string') {
        console.error('Invalid user ID type:', typeof user.id);
        setLoading(false);
        return;
      }

      try {
        // Fetch all data in parallel
        const [listingsResult, activeOrdersResult, completedOrdersResult, reviewsResult, recentListingsResult] = await Promise.all([
          // Total Listings Count
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('driverId', user.id), // user.id is UUID string

          // Active Orders Count
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('driverId', user.id)
            .in('status', ['Onay Bekliyor', 'Hazırlanıyor', 'Yolda']),

          // Total Earnings (all completed orders - use final_price)
          supabase
            .from('orders')
            .select('final_price, completedAt')
            .eq('driverId', user.id)
            .eq('status', 'Tamamlandı')
            .not('completedAt', 'is', null),

          // Average Rating
          supabase
            .from('reviews')
            .select('rating')
            .eq('driverId', user.id),

          // Recent Listings (last 3)
          supabase
            .from('listings')
            .select('id, from, to, date, capacity, price')
            .eq('driverId', user.id)
            .order('createdAt', { ascending: false })
            .limit(3)
        ]);

        // Calculate total listings
        const totalListings = listingsResult.count || 0;

        // Calculate active orders
        const activeOrders = activeOrdersResult.count || 0;

        // Calculate total earnings from final_price (same logic as SoforIstatistikler)
        // Only count orders with status = 'Tamamlandı' and completedAt IS NOT NULL
        let totalEarnings = 0;
        if (completedOrdersResult.data) {
          completedOrdersResult.data.forEach((order) => {
            // Use Number() for mathematical operations (same as SoforIstatistikler.tsx)
            if (order.final_price) {
              const priceNum = Number(order.final_price);
              if (!isNaN(priceNum) && priceNum > 0) {
                totalEarnings += priceNum;
              }
            }
          });
        }
        const formattedEarnings = totalEarnings.toLocaleString('tr-TR', {
          style: 'currency',
          currency: 'TRY',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        // Calculate average rating
        let avgRating = 0;
        if (reviewsResult.data && reviewsResult.data.length > 0) {
          const sum = reviewsResult.data.reduce((acc, review) => acc + review.rating, 0);
          avgRating = sum / reviewsResult.data.length;
        }

        // Format recent listings
        const formattedListings: RecentListing[] = (recentListingsResult.data || []).map((listing) => ({
          id: listing.id,
          from: listing.from,
          to: listing.to,
          date: listing.date,
          capacity: listing.capacity,
          price: listing.price
        }));

        setStats({
          totalListings,
          activeOrders,
          monthlyEarnings: formattedEarnings,
          avgRating: avgRating.toFixed(1)
        });
        setRecentListings(formattedListings);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Fetch total unread messages (driver_unread_count for driver)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('driver_unread_count')
          .eq('driverId', user.id);

        if (!error && data) {
          const total = data.reduce((sum, conv) => sum + (conv.driver_unread_count || 0), 0);
          setTotalUnread(total);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const statsData = [
    { label: "Toplam Yük", value: loading ? "..." : stats.totalListings.toString(), icon: Package, color: "primary" },
    { label: "Aktif İşlem", value: loading ? "..." : stats.activeOrders.toString(), icon: Clock, color: "secondary" },
    { label: "Toplam Kazanç", value: loading ? "..." : stats.monthlyEarnings, icon: DollarSign, color: "primary" },
    { label: "Değerlendirme", value: loading ? "..." : stats.avgRating, icon: Star, color: "secondary" },
  ];

  return (
    <DashboardLayout role="sofor">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Hoş Geldiniz, {profileLoading ? '...' : displayName.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">Bugünkü durumunuz ve son işlemleriniz</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/sofor/ilan-olustur">
              <Plus className="w-4 h-4" />
              Yeni İlan Oluştur
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <Card key={index} className="animate-slide-up hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl ${stat.color === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  {!loading && (stat.value !== "0" && stat.value !== "₺0" && stat.value !== "0.0") && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="text-2xl md:text-3xl font-bold min-h-[2.5rem] flex items-center">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Son İlanlarım</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sofor/ilanlar">
                  Tümünü Gör
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Yükleniyor...
                </div>
              ) : recentListings.length > 0 ? (
                recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Route className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{listing.from} → {listing.to}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {listing.date}
                          <span>•</span>
                          <Package className="w-3 h-3" />
                          {listing.capacity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-secondary">{listing.price}</div>
                      <div className="text-xs text-muted-foreground">Başlangıç fiyatı</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Henüz ilanınız bulunmuyor</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/sofor/ilan-olustur">
                      <Plus className="w-4 h-4 mr-2" />
                      İlan Oluştur
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/sofor/ilan-olustur" className="block">
                <div className="flex items-center p-4 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-md transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Yeni İlan Oluştur</div>
                    <div className="text-sm text-muted-foreground">Güzergahınızı ve fiyatınızı belirleyin</div>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              <Link to="/sofor/konum" className="block">
                <div className="flex items-center p-4 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-md transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-secondary transition-colors">Konum Paylaş</div>
                    <div className="text-sm text-muted-foreground">Müşterilerinize konumunuzu bildirin</div>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              <Link to="/sofor/mesajlar" className="block">
                <div className="flex items-center p-4 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-md transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      Mesajları Kontrol Et
                      {totalUnread > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {totalUnread > 0
                        ? `${totalUnread} yeni mesajınız var`
                        : 'Müşterilerinizle iletişime geçin'}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SoforPanel;
