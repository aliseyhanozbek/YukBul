import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

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

interface ActiveOrder {
  id: number;
  orderId: number;
  from: string;
  to: string;
  customerName: string;
  status: string;
}

const SoforKonum = () => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  // Fetch active orders
  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        setLoading(false);
        return;
      }

      try {
        // Fetch orders with status 'Yolda' or 'Hazırlanıyor'
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, from, to, status, customerId')
          .eq('driverId', user.id)
          .in('status', ['Yolda', 'Hazırlanıyor', 'Onay Bekliyor']);

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          setLoading(false);
          return;
        }

        if (ordersData && ordersData.length > 0) {
          // Fetch customer names
          const ordersWithCustomers = await Promise.all(
            ordersData.map(async (order) => {
              if (!order.customerId) {
                return {
                  id: order.id,
                  orderId: order.id,
                  from: order.from,
                  to: order.to,
                  customerName: 'Bilinmeyen Müşteri',
                  status: order.status
                };
              }

              const { data: customerData, error: customerError } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.customerId)
                .maybeSingle();

              return {
                id: order.id,
                orderId: order.id,
                from: order.from,
                to: order.to,
                customerName: customerData?.name || 'Bilinmeyen Müşteri',
                status: order.status
              };
            })
          );

          setActiveOrders(ordersWithCustomers);
        }
      } catch (error) {
        console.error('Error fetching active orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [user]);

  // Check if location sharing is already active
  useEffect(() => {
    const checkExistingSharing = async () => {
      if (!user?.id || typeof user.id !== 'string') return;

      try {
        const { data, error } = await supabase
          .from('locationSharing')
          .select('*')
          .eq('driverId', user.id)
          .eq('isSharing', true)
          .maybeSingle();

        if (!error && data) {
          setIsSharing(true);
          if (data.latitude && data.longitude) {
            setPosition([Number(data.latitude), Number(data.longitude)]);
          }
          if (data.lastUpdate) {
            setLastUpdate(data.lastUpdate);
          }
        }
      } catch (error) {
        console.error('Error checking existing sharing:', error);
      }
    };

    checkExistingSharing();
  }, [user]);

  const updateLocationInDB = async (lat: number, lng: number, orderId?: number) => {
    if (!user?.id || typeof user.id !== 'string') return;

    try {
      // Format time as HH:mm:ss
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:${seconds}`;

      // Get orderId from active orders if not provided
      let finalOrderId = orderId;
      if (!finalOrderId && activeOrders.length > 0) {
        finalOrderId = activeOrders[0].orderId;
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from('locationSharing')
        .select('id, orderId')
        .eq('driverId', user.id)
        .eq('isSharing', true)
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('locationSharing')
          .update({
            latitude: lat.toString(),
            longitude: lng.toString(),
            isSharing: true,
            lastUpdate: timeString,
            orderId: finalOrderId || existing.orderId || null,
            updatedAt: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating location:', error);
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('locationSharing')
          .insert({
            driverId: user.id,
            latitude: lat.toString(),
            longitude: lng.toString(),
            isSharing: true,
            lastUpdate: timeString,
            orderId: finalOrderId || null
          });

        if (error) {
          console.error('Error inserting location:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateLocationInDB:', error);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

    // Get orderId from active orders
    const currentOrderId = activeOrders.length > 0 ? activeOrders[0].orderId : null;

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        setIsSharing(true);

        // Format time as HH:mm:ss
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        setLastUpdate(timeString);

        // Update database with isSharing=true
        updateLocationInDB(latitude, longitude, currentOrderId || undefined);

        toast.success("Konum paylaşımı başlatıldı!");

        // Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setPosition([lat, lng]);

            // Format time as HH:mm:ss
            const updateNow = new Date();
            const updateHours = updateNow.getHours().toString().padStart(2, '0');
            const updateMinutes = updateNow.getMinutes().toString().padStart(2, '0');
            const updateSeconds = updateNow.getSeconds().toString().padStart(2, '0');
            const updateTimeString = `${updateHours}:${updateMinutes}:${updateSeconds}`;
            setLastUpdate(updateTimeString);

            updateLocationInDB(lat, lng, currentOrderId || undefined);
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast.error("Konum güncellenirken bir hata oluştu.");
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      },
      (error) => {
        toast.error("Konum alınamadı. Lütfen konum izni verin.");
      }
    );
  };

  const handleStopSharing = async () => {
    // Stop watching position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsSharing(false);
    setLastUpdate(null);
    toast.info("Konum paylaşımı durduruldu.");

    // Update database - set isSharing to false
    if (user?.id && typeof user.id === 'string') {
      try {
        const { error } = await supabase
          .from('locationSharing')
          .update({ isSharing: false })
          .eq('driverId', user.id)
          .eq('isSharing', true);

        if (error) {
          console.error('Error stopping sharing:', error);
        }
      } catch (error) {
        console.error('Error in handleStopSharing:', error);
      }
    }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

    const currentOrderId = activeOrders.length > 0 ? activeOrders[0].orderId : undefined;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);

        // Format time as HH:mm:ss
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        setLastUpdate(timeString);

        updateLocationInDB(latitude, longitude, currentOrderId);
        toast.success("Konum güncellendi!");
      },
      (error) => {
        toast.error("Konum alınamadı. Lütfen konum izni verin.");
      }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Default position (Ankara)
  const defaultPosition: [number, number] = [39.9334, 32.8597];

  return (
    <DashboardLayout role="sofor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Konum Paylaşımı</h1>
          <p className="text-muted-foreground">Müşterilerinize konumunuzu bildirin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div className="relative h-[500px] w-full overflow-hidden rounded-xl border-2 border-border shadow-inner">
                <MapContainer
                  center={position || defaultPosition}
                  zoom={position ? 13 : 6}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-xl"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {position && (
                    <Marker position={position} icon={DefaultIcon}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">Konumunuz</p>
                          <p className="text-sm text-muted-foreground">
                            {position[0].toFixed(6)}, {position[1].toFixed(6)}
                          </p>
                          {lastUpdate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Son güncelleme: {lastUpdate}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Konum Kontrolleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSharing ? (
                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={handleShareLocation}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Konumu Paylaş
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={handleUpdateLocation}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Konumu Güncelle
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    size="lg"
                    onClick={handleStopSharing}
                  >
                    Paylaşımı Durdur
                  </Button>
                </>
              )}

              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {isSharing ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {isSharing ? "Konum paylaşılıyor" : "Konum paylaşılmıyor"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSharing
                    ? "Müşterileriniz konumunuzu canlı olarak görebiliyor."
                    : "Konum paylaşımı başlattığınızda müşterileriniz sizi takip edebilir."
                  }
                </p>
                {lastUpdate && isSharing && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Son güncelleme: {lastUpdate}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Shipments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                Aktif Sevkiyatlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground py-4">
                  Yükleniyor...
                </div>
              ) : activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-muted/50 rounded-xl">
                    <div className="font-medium mb-1">{order.from} → {order.to}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customerName}
                    </div>
                    {isSharing && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-green-600">Konum görüntüleniyor</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Aktif sevkiyat bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SoforKonum;
