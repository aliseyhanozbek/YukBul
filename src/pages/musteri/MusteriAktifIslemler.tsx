import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { 
  Truck, MapPin, User, Star, Clock, Phone, MessageSquare,
  Package, Calendar, CheckCircle2, Navigation, History, Search, X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Order {
  id: number;
  customerId: string | null;
  driverId: string | null;
  listingId: number | null;
  from: string;
  to: string;
  date: string;
  price: string;
  status: 'Onay Bekliyor' | 'Hazırlanıyor' | 'Yolda' | 'Tamamlandı' | 'İptal';
  progress: number;
  cargo: string | null;
  vehicleType: string | null;
  eta: string | null;
  arrivalDate: string | null;
  completedAt?: string | null;
  customer_completed?: boolean;
  driver_completed?: boolean;
  driverName?: string;
  driverRating?: number;
  hasRating?: boolean;
  userRating?: number;
}

const MusteriAktifIslemler = () => {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<Order | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Filter state for completed orders
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const fetchOrders = async () => {
    if (!user?.id || typeof user.id !== 'string') {
      setLoading(false);
      return;
    }

    try {
      // Fetch active orders (status: 'Onay Bekliyor', 'Hazırlanıyor', 'Yolda')
      const { data: activeData, error: activeError } = await supabase
        .from('orders')
        .select('*, customer_completed, driver_completed, completedAt')
        .eq('customerId', user.id)
        .in('status', ['Onay Bekliyor', 'Hazırlanıyor', 'Yolda'])
        .order('createdAt', { ascending: false });

      // Fetch completed orders
      const { data: completedData, error: completedError } = await supabase
        .from('orders')
        .select('*, customer_completed, driver_completed, completedAt')
        .eq('customerId', user.id)
        .eq('status', 'Tamamlandı')
        .not('completedAt', 'is', null)
        .order('completedAt', { ascending: false });

      if (activeError || completedError) {
        console.error('Error fetching orders:', activeError || completedError);
        setLoading(false);
        return;
      }

      // Process active orders
      if (activeData) {
        const ordersWithDrivers = await Promise.all(
          activeData.map(async (order) => {
            let driverName = 'Bilinmeyen Şoför';
            let driverRating = 0;
            let arrivalDate = order.eta || null;

            if (order.driverId) {
              // Calculate driver rating from reviews table
              const { data: allReviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('driverId', order.driverId);

              if (allReviews && allReviews.length > 0) {
                const totalRating = allReviews.reduce((sum, review) => sum + Number(review.rating), 0);
                driverRating = totalRating / allReviews.length;
              }

              const { data: driverData, error: driverError } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.driverId)
                .maybeSingle();

              if (!driverError && driverData) {
                driverName = driverData.name || 'Bilinmeyen Şoför';
              }
            }

            if (order.listingId && !arrivalDate) {
              const { data: listingData, error: listingError } = await supabase
                .from('listings')
                .select('arrival_date')
                .eq('id', order.listingId)
                .maybeSingle();

              if (!listingError && listingData?.arrival_date) {
                arrivalDate = listingData.arrival_date;
              }
            }

            return {
              ...order,
              driverName,
              driverRating,
              arrivalDate
            };
          })
        );
        setActiveOrders(ordersWithDrivers);
      }

      // Process completed orders with rating info
      if (completedData) {
        const ordersWithRatings = await Promise.all(
          completedData.map(async (order) => {
            let driverName = 'Bilinmeyen Şoför';
            let driverRating = 0;
            let hasRating = false;
            let userRating = 0;

            // Check if review exists for this order
            const { data: reviewData } = await supabase
              .from('reviews')
              .select('rating')
              .eq('orderId', order.id)
              .eq('customerId', user.id)
              .maybeSingle();

            if (reviewData) {
              hasRating = true;
              userRating = reviewData.rating;
            }

            if (order.driverId) {
              // Calculate driver rating from reviews table
              const { data: allReviews } = await supabase
                .from('reviews')
                .select('rating')
                .eq('driverId', order.driverId);

              if (allReviews && allReviews.length > 0) {
                const totalRating = allReviews.reduce((sum, review) => sum + Number(review.rating), 0);
                driverRating = totalRating / allReviews.length;
              }

              const { data: driverData } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.driverId)
                .maybeSingle();

              if (driverData) {
                driverName = driverData.name || 'Bilinmeyen Şoför';
              }
            }

            return {
              ...order,
              driverName,
              driverRating,
              hasRating,
              userRating
            };
          })
        );
        setCompletedOrders(ordersWithRatings);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Refresh orders when storage event is triggered (e.g., when order is created from messages page)
  useEffect(() => {
    if (!user?.id) return;

    const handleStorageChange = () => {
      if (!loading) {
        fetchOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen to custom storage events (for same-tab communication)
    window.addEventListener('orderCreated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderCreated', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Refresh orders when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && !loading) {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  const handleCompleteOrder = async () => {
    if (!selectedOrderId || completing) return;

    setCompleting(true);
    try {
      // Update customer_completed to true
      const { error: updateError } = await supabase
        .from('orders')
        .update({ customer_completed: true })
        .eq('id', selectedOrderId);

      if (updateError) {
        console.error('Error completing order:', updateError);
        toast.error('Sevkiyat tamamlanırken bir hata oluştu');
        setCompleting(false);
        return;
      }

      // Check if both parties completed
      const { data: orderData, error: checkError } = await supabase
        .from('orders')
        .select('customer_completed, driver_completed, listingId')
        .eq('id', selectedOrderId)
        .single();

      if (!checkError && orderData) {
        // If both completed, update status to 'Tamamlandı' and set completedAt
        if (orderData.customer_completed && orderData.driver_completed) {
          const completedDate = new Date().toISOString().split('T')[0];
          await supabase
            .from('orders')
            .update({ 
              status: 'Tamamlandı',
              completedAt: completedDate
            })
            .eq('id', selectedOrderId);

          // Update listing status to 'Tamamlandı' if listingId exists
          if (orderData.listingId) {
            await supabase
              .from('listings')
              .update({ status: 'Tamamlandı' })
              .eq('id', orderData.listingId);
          }
        }

        // Refresh orders list
        await fetchOrders();

        toast.success('Sevkiyat tamamlandı olarak işaretlendi');
      }

      setShowCompleteDialog(false);
      setSelectedOrderId(null);
    } catch (error) {
      console.error('Error in handleCompleteOrder:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setCompleting(false);
    }
  };

  const handleRateOrder = async () => {
    if (!selectedOrderForRating || !selectedRating || submittingRating) return;

    setSubmittingRating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          customerId: user?.id,
          driverId: selectedOrderForRating.driverId,
          orderId: selectedOrderForRating.id,
          rating: selectedRating,
          date: today
        });

      if (error) {
        console.error('Error submitting rating:', error);
        toast.error('Puan verilirken bir hata oluştu');
        setSubmittingRating(false);
        return;
      }

      toast.success('Puanınız başarıyla kaydedildi');
      setShowRatingDialog(false);
      setSelectedOrderForRating(null);
      setSelectedRating(0);
      
      // Refresh orders to show updated rating
      await fetchOrders();
    } catch (error) {
      console.error('Error in handleRateOrder:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="musteri">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">İşlemlerim</h1>
            <p className="text-muted-foreground">Aktif ve geçmiş sevkiyatlarınızı takip edin</p>
          </div>
          <div className="text-center text-muted-foreground py-8">Yükleniyor...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="musteri">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">İşlemlerim</h1>
          <p className="text-muted-foreground">Aktif ve geçmiş sevkiyatlarınızı takip edin</p>
        </div>

        {/* Devam Eden Sevkiyatlar */}
        {activeOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Devam Eden Sevkiyatlar
            </h2>
            {activeOrders.map((islem) => (
              <Card key={islem.id} className="border-secondary/50 overflow-hidden">
                <div className="h-1.5 bg-muted">
                  <div 
                    className="h-full bg-secondary transition-all duration-500"
                    style={{ width: `${islem.progress}%` }}
                  />
                </div>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Driver Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{islem.driverName || 'Bilinmeyen Şoför'}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{islem.driverRating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/musteri/mesajlar">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Mesaj
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            Ara
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <span className="font-medium">{islem.from}</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary rounded" />
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-secondary" />
                          <span className="font-medium">{islem.to}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Hareket Tarihi: {islem.date}</span>
                        </div>
                        {(islem.arrivalDate || islem.eta) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Navigation className="w-4 h-4" />
                            <span>Tahmini Varış: {islem.arrivalDate || islem.eta}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {islem.cargo && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {islem.cargo}
                          </span>
                        )}
                        {islem.vehicleType && (
                          <span className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            {islem.vehicleType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <Badge 
                        className={`text-sm px-3 py-1 ${
                          islem.status === 'Onay Bekliyor' 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                            : islem.status === 'Hazırlanıyor'
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : islem.status === 'Yolda'
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        {islem.status === 'Onay Bekliyor' 
                          ? 'Aktif Sevkiyat' 
                          : islem.status === 'Hazırlanıyor'
                          ? 'Aktif'
                          : islem.status === 'Yolda'
                          ? 'Yolda'
                          : islem.status}
                      </Badge>
                      <Button variant="secondary" asChild>
                        <Link to={`/musteri/takip?orderId=${islem.id}`}>
                          <MapPin className="w-4 h-4 mr-2" />
                          Konumu Takip Et
                        </Link>
                      </Button>
                      {islem.customer_completed ? (
                        <div className="text-sm text-muted-foreground text-center">
                          {islem.driver_completed 
                            ? 'Sevkiyat tamamlandı' 
                            : 'Karşı tarafın onayı bekleniyor...'}
                        </div>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            setSelectedOrderId(islem.id);
                            setShowCompleteDialog(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Sevkiyatı Tamamla
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Geçmiş Sevkiyatlar */}
        {completedOrders.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Geçmiş Sevkiyatlar
            </h2>
            
            {/* Filter Bar */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Route Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Kalkış veya varış yeri..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Date Filter */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="Tarih Seç"
                    className="pl-10"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
                
                {/* Clear Filters */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterDate("");
                  }}
                  className="w-full md:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Temizle
                </Button>
              </div>
            </div>
            
            {/* Filtered Orders */}
            {(() => {
              // Filter completed orders
              const filteredCompleted = completedOrders.filter((islem) => {
                // City search filter (case-insensitive search in both from and to)
                const cityMatch = !searchTerm.trim() || 
                  islem.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  islem.to.toLowerCase().includes(searchTerm.toLowerCase());
                
                // Date filter - compare YYYY-MM-DD format
                let dateMatch = true;
                if (filterDate && islem.completedAt) {
                  // Convert completedAt to YYYY-MM-DD format
                  const completedDateStr = new Date(islem.completedAt).toISOString().split('T')[0];
                  // Compare with selected date (already in YYYY-MM-DD format)
                  dateMatch = completedDateStr === filterDate;
                } else if (filterDate && !islem.completedAt) {
                  // If date filter is set but order has no completedAt, exclude it
                  dateMatch = false;
                }
                
                return cityMatch && dateMatch;
              });
              
              if (filteredCompleted.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aradığınız kriterlere uygun geçmiş işlem bulunamadı</h3>
                      <p className="text-sm text-muted-foreground">
                        Farklı filtreler deneyebilir veya filtreleri temizleyebilirsiniz.
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              
              return (
                <>
                  {filteredCompleted.map((islem) => (
                    <Card key={islem.id} className="border-muted">
                      <CardContent className="p-5">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Driver Info */}
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg">{islem.driverName || 'Bilinmeyen Şoför'}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>{islem.driverRating?.toFixed(1) || '0.0'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Route Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="font-medium">{islem.from}</span>
                              </div>
                              <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary rounded" />
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-secondary" />
                                <span className="font-medium">{islem.to}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Tamamlanma Tarihi: {islem.completedAt || '-'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Rating Section */}
                          <div className="flex flex-col items-end gap-3">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Tamamlandı
                            </Badge>
                            {islem.hasRating ? (
                              <div className="text-sm text-muted-foreground text-center">
                                <div className="flex items-center gap-1 justify-center mb-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-semibold">Puanınız: {islem.userRating}/5</span>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderForRating(islem);
                                  setShowRatingDialog(true);
                                  setSelectedRating(0);
                                }}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Hizmeti Puanla
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              );
            })()}
          </div>
        )}

        {/* Empty State */}
        {activeOrders.length === 0 && completedOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">İşlem bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                Henüz bir sevkiyatınız bulunmuyor.
              </p>
              <Button variant="hero" asChild>
                <Link to="/musteri/ilanlar">İlanları Görüntüle</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Complete Order Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sevkiyatı Tamamla</AlertDialogTitle>
            <AlertDialogDescription>
              Sevkiyatın sorunsuz tamamlandığını ve teslim aldığınızı onaylıyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Hayır</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteOrder}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? 'İşleniyor...' : 'Evet, Onaylıyorum'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hizmeti Puanla</DialogTitle>
            <DialogDescription>
              {selectedOrderForRating && (
                <div className="mt-2">
                  <p className="font-medium">{selectedOrderForRating.from} → {selectedOrderForRating.to}</p>
                  <p className="text-sm text-muted-foreground mt-1">Şoför: {selectedOrderForRating.driverName}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setSelectedRating(rating)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      rating <= selectedRating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {selectedRating > 0 && (
              <p className="text-center mt-4 text-sm text-muted-foreground">
                {selectedRating} yıldız seçtiniz
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRatingDialog(false);
                setSelectedRating(0);
                setSelectedOrderForRating(null);
              }}
              disabled={submittingRating}
            >
              İptal
            </Button>
            <Button
              onClick={handleRateOrder}
              disabled={selectedRating === 0 || submittingRating}
            >
              {submittingRating ? 'Kaydediliyor...' : 'Puanı Gönder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MusteriAktifIslemler;
