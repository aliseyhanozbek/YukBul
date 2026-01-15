import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, Clock, Star, ArrowRight, Search,
  Calendar, MapPin, Truck, User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { getActiveOrders } from "@/services/orderService";
import { getUserById } from "@/services/userService";
import { getReviewsByDriverId } from "@/services/reviewService";

const MusteriPanel = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

  // Get display name with fallback
  const displayName = profile?.name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Yükleniyor...';

  // Search form state
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");

  const [activeOrder, setActiveOrder] = useState<{
    id: number;
    driver: string;
    rating: number;
    from: string;
    to: string;
    status: string;
  } | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // Handle search form submission
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (fromCity.trim()) {
      params.append('from', fromCity.trim());
    }
    if (toCity.trim()) {
      params.append('to', toCity.trim());
    }
    if (shipmentDate) {
      params.append('date', shipmentDate);
    }

    // Navigate to listings page with search parameters
    navigate(`/musteri/ilanlar?${params.toString()}`);
  };

  // Fetch active order
  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        setLoadingOrder(false);
        return;
      }

      try {
        // Fetch the most recent active order (only from orders table - these are already approved by both parties)
        const activeOrders = await getActiveOrders(user.id, 'customer');
        
        if (activeOrders.length > 0) {
          const ordersData = activeOrders[0];
          
          // Fetch driver information
          let driverName = 'Bilinmeyen Şoför';
          let driverRating = 0;

          if (ordersData.driverId) {
            const [driverData, reviews] = await Promise.all([
              getUserById(ordersData.driverId),
              getReviewsByDriverId(ordersData.driverId)
            ]);

            if (driverData) {
              driverName = driverData.name || 'Bilinmeyen Şoför';
              driverRating = reviews.length > 0
                ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
                : 0;
            }
          }

          setActiveOrder({
            id: ordersData.id,
            driver: driverName,
            rating: driverRating,
            from: ordersData.from,
            to: ordersData.to,
            status: ordersData.status
          });
        }
      } catch (error) {
        console.error('Error fetching active order:', error);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchActiveOrder();
  }, [user]);

  return (
    <DashboardLayout role="musteri">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Hoş Geldiniz, {profileLoading ? '...' : displayName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Size uygun nakliye ilanlarını keşfedin</p>
        </div>

        {/* Search Section */}
        <Card className="overflow-hidden">
          <div className="h-2 gradient-secondary" />
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Nereden"
                  className="pl-10"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Nereye"
                  className="pl-10"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10"
                  value={shipmentDate}
                  onChange={(e) => setShipmentDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button variant="accent" className="w-full" onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                İlan Ara
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Order */}
        {loadingOrder ? (
          <Card className="border-secondary/50 bg-secondary/5">
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Yükleniyor...</div>
            </CardContent>
          </Card>
        ) : activeOrder ? (
          <Card className="border-secondary/50 bg-secondary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Aktif Sevkiyat
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/musteri/takip?orderId=${activeOrder.id}`}>
                  Takip Et
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="font-medium">{activeOrder.from} → {activeOrder.to}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {activeOrder.driver}
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {activeOrder.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge
                      className={`text-sm px-3 py-1 ${activeOrder.status === 'Yolda'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : activeOrder.status === 'Hazırlanıyor'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                      {activeOrder.status === 'Onay Bekliyor' ? 'Aktif Sevkiyat' : activeOrder.status}
                    </Badge>
                  </div>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={`/musteri/takip?orderId=${activeOrder.id}`}>
                      <MapPin className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Henüz aktif bir sevkiyatınız bulunmuyor</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Aktif sevkiyatlarınız burada görünecek
              </p>
              <Button variant="outline" asChild>
                <Link to="/musteri/ilanlar">
                  İlanları Görüntüle
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MusteriPanel;
