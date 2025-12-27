import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, User, Star, Phone, MessageSquare, Truck, Clock,
  Calendar, Navigation
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";

// Fix for default marker icon in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

interface OrderData {
  id: number;
  from: string;
  to: string;
  date: string;
  driverId: string | null;
  driverName: string;
  driverRating: number;
  vehicleType: string | null;
  vehiclePlate: string | null;
}

const MusteriTakip = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        setLoading(false);
        return;
      }

      try {
        const orderIdParam = searchParams.get('orderId');
        let orderId: number | null = null;

        if (orderIdParam) {
          orderId = parseInt(orderIdParam, 10);
        } else {
          // If no orderId in URL, get the most recent active order
          const { data: recentOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('customerId', user.id)
            .in('status', ['Yolda', 'Hazırlanıyor', 'Onay Bekliyor'])
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentOrder) {
            orderId = recentOrder.id;
          }
        }

        if (!orderId) {
          setLoading(false);
          return;
        }

        // Fetch order data
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, from, to, date, driverId, listingId')
          .eq('id', orderId)
          .eq('customerId', user.id)
          .maybeSingle();

        if (orderError || !order) {
          console.error('Error fetching order:', orderError);
          setLoading(false);
          return;
        }

        // Fetch driver data
        let driverName = 'Bilinmeyen Şoför';
        let driverRating = 0;
        let vehicleType = null;
        let vehiclePlate = null;

        if (order.driverId) {
          const { data: driverData, error: driverError } = await supabase
            .from('users')
            .select('name, rating, vehicle, plate')
            .eq('id', order.driverId)
            .maybeSingle();

          if (!driverError && driverData) {
            driverName = driverData.name || 'Bilinmeyen Şoför';
            driverRating = driverData.rating || 0;
            vehicleType = driverData.vehicle || null;
            vehiclePlate = driverData.plate || null;
          }
        }

        // Fetch vehicle info from listing if available
        if (order.listingId && !vehicleType) {
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('vehicleType')
            .eq('id', order.listingId)
            .maybeSingle();

          if (!listingError && listingData?.vehicleType) {
            vehicleType = listingData.vehicleType;
          }
        }

        setOrderData({
          id: order.id,
          from: order.from,
          to: order.to,
          date: order.date,
          driverId: order.driverId,
          driverName,
          driverRating,
          vehicleType,
          vehiclePlate
        });

        // Fetch location from locationSharing
        if (order.driverId) {
          const { data: locationData, error: locationError } = await supabase
            .from('locationSharing')
            .select('latitude, longitude, lastUpdate, isSharing')
            .eq('driverId', order.driverId)
            .eq('orderId', order.id)
            .order('updatedAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!locationError && locationData) {
            setIsSharing(locationData.isSharing || false);
            if (locationData.isSharing && locationData.latitude && locationData.longitude) {
              setLocation([Number(locationData.latitude), Number(locationData.longitude)]);
              setLastUpdate(locationData.lastUpdate || null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
        toast.error('Sipariş bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [user, searchParams]);

  // Subscribe to realtime updates for locationSharing
  useEffect(() => {
    if (!orderData?.driverId || !orderData?.id) return;

    const channel = supabase
      .channel(`location-sharing-${orderData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locationSharing',
          filter: `driverId=eq.${orderData.driverId} AND orderId=eq.${orderData.id}`
        },
        (payload) => {
          console.log('Location update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as any;
            
            if (newData.isSharing) {
              setIsSharing(true);
              if (newData.latitude && newData.longitude) {
                setLocation([Number(newData.latitude), Number(newData.longitude)]);
                setLastUpdate(newData.lastUpdate || null);
              }
            } else {
              setIsSharing(false);
              setLocation(null);
              setLastUpdate(null);
            }
          } else if (payload.eventType === 'DELETE') {
            setIsSharing(false);
            setLocation(null);
            setLastUpdate(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderData?.driverId, orderData?.id]);

  if (loading) {
    return (
      <DashboardLayout role="musteri">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sevkiyat Takibi</h1>
            <p className="text-muted-foreground">Kargonuzun konumunu canlı takip edin</p>
          </div>
          <div className="text-center text-muted-foreground py-8">Yükleniyor...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!orderData) {
    return (
      <DashboardLayout role="musteri">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sevkiyat Takibi</h1>
            <p className="text-muted-foreground">Kargonuzun konumunu canlı takip edin</p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Aktif bir sevkiyat bulunamadı.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Default position (Ankara) if no location
  const defaultPosition: [number, number] = [39.9334, 32.8597];
  const mapCenter = location || defaultPosition;
  const mapZoom = location ? 13 : 6;

  return (
    <DashboardLayout role="musteri">
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sevkiyat Takibi</h1>
            <p className="text-muted-foreground">Kargonuzun konumunu canlı takip edin</p>
          </div>
          {isSharing && location && (
            <Badge variant="secondary" className="w-fit text-sm px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
              Canlı Takip Aktif
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                Konum Haritası
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isSharing && location ? (
                <div className="relative h-[500px] w-full overflow-hidden rounded-xl border-2 border-border shadow-inner">
                  <MapContainer
                    center={location}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-xl"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={location} />
                    <Marker position={location} icon={DefaultIcon} key={`${location[0]}-${location[1]}`}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">Şoför Konumu</p>
                          <p className="text-sm text-muted-foreground">
                            {location[0].toFixed(6)}, {location[1].toFixed(6)}
                          </p>
                          {lastUpdate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Son güncelleme: {lastUpdate}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="relative h-[500px] w-full overflow-hidden rounded-xl border-2 border-border shadow-inner bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <MapPin className="w-12 h-12 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Şoför şu an konum paylaşmıyor
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Şoför konum paylaşımını başlattığında harita burada otomatik olarak görünecek ve sevkiyatınızı canlı takip edebileceksiniz.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipment Details */}
          <div className="space-y-4">
            {/* Driver Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{orderData.driverName}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{orderData.driverRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                {orderData.vehicleType && (
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {orderData.vehicleType}
                    </div>
                    {orderData.vehiclePlate && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                          {orderData.vehiclePlate}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/musteri/mesajlar">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Mesaj
                    </Link>
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    <Phone className="w-4 h-4 mr-1" />
                    Ara
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ETA Card */}
            <Card className="bg-secondary/5 border-secondary/30">
              <CardContent className="p-5 text-center">
                <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Tahmini Varış Süresi</div>
                <div className="text-lg font-medium text-muted-foreground mt-2">
                  Tahmini varış saati hesaplanıyor...
                </div>
              </CardContent>
            </Card>

            {/* Route Details */}
            <Card>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-0.5 h-12 bg-gradient-to-b from-primary to-secondary" />
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Kalkış</div>
                        <div className="font-medium">{orderData.from}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Varış</div>
                        <div className="font-medium">{orderData.to}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MusteriTakip;
