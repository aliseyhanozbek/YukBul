import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock, MapPin, User, Calendar, CheckCircle2,
  MessageSquare, Navigation, Truck, Package, Phone, Calculator,
  History, Star, ArrowRight, Search, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Order {
  id: number;
  customerId: string | null;
  driverId: string | null;
  listingId: number | null;
  from: string;
  to: string;
  date: string;
  price: string | number;
  final_price?: string | number | null;
  status: 'Onay Bekliyor' | 'Hazırlanıyor' | 'Yolda' | 'Tamamlandı' | 'İptal';
  progress: number;
  cargo: string | null;
  vehicleType: string | null;
  eta: string | null;
  arrivalDate: string | null;
  completedAt?: string | null;
  customer_completed?: boolean;
  driver_completed?: boolean;
  customerName?: string;
  net_profit?: number;
}

const SoforAktifIslemler = () => {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completing, setCompleting] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [loadingRating, setLoadingRating] = useState(true);

  // Form state
  const [totalKm, setTotalKm] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [roadCost, setRoadCost] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [finalPrice, setFinalPrice] = useState("");

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
        .select('*, customer_completed, driver_completed, final_price')
        .eq('driverId', user.id)
        .in('status', ['Onay Bekliyor', 'Hazırlanıyor', 'Yolda'])
        .order('createdAt', { ascending: false });

      // Fetch completed orders
      const { data: completedData, error: completedError } = await supabase
        .from('orders')
        .select('*, customer_completed, driver_completed, completedAt, net_profit')
        .eq('driverId', user.id)
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
        const ordersWithNames = await Promise.all(
          activeData.map(async (order) => {
            let customerName = 'Bilinmeyen Müşteri';
            let arrivalDate = order.eta || null;

            if (order.customerId) {
              const { data: customerData, error: customerError } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.customerId)
                .maybeSingle();

              if (!customerError && customerData) {
                customerName = customerData.name || 'Bilinmeyen Müşteri';
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
              customerName,
              arrivalDate
            };
          })
        );
        setActiveOrders(ordersWithNames);
      }

      // Process completed orders
      if (completedData) {
        const ordersWithCustomers = await Promise.all(
          completedData.map(async (order) => {
            let customerName = 'Bilinmeyen Müşteri';

            if (order.customerId) {
              const { data: customerData, error: customerError } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.customerId)
                .maybeSingle();

              if (!customerError && customerData) {
                customerName = customerData.name || 'Bilinmeyen Müşteri';
              }
            }

            return {
              ...order,
              customerName,
              net_profit: Number(order.net_profit) || 0
            };
          })
        );
        setCompletedOrders(ordersWithCustomers);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch driver average rating
  useEffect(() => {
    const fetchRating = async () => {
      if (!user?.id) {
        setLoadingRating(false);
        return;
      }

      try {
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('driverId', user.id);

        if (error) {
          console.error('Error fetching reviews:', error);
          setLoadingRating(false);
          return;
        }

        if (reviewsData && reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((sum, review) => sum + Number(review.rating), 0);
          const average = totalRating / reviewsData.length;
          setAvgRating(average);
        } else {
          setAvgRating(0);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      } finally {
        setLoadingRating(false);
      }
    };

    fetchRating();
  }, [user?.id]);

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

  // Refresh orders when page becomes visible (user switches back to tab)
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

  // Calculate net profit
  const calculateNetProfit = () => {
    const final = parseFloat(finalPrice.replace(/[₺,\s]/g, '')) || 0;
    const fuel = parseFloat(fuelCost.replace(/[₺,\s]/g, '')) || 0;
    const road = parseFloat(roadCost.replace(/[₺,\s]/g, '')) || 0;
    const other = parseFloat(otherExpenses.replace(/[₺,\s]/g, '')) || 0;
    const totalExpenses = fuel + road + other;
    const netProfit = final - totalExpenses;
    return { netProfit, totalExpenses };
  };

  const handleOpenCompleteDialog = (order: Order) => {
    setSelectedOrder(order);
    // Use final_price from order if available, otherwise fallback to price
    // Convert to string for display (handle both number and string types)
    const finalPriceValue = order.final_price;
    const priceValue = order.price;

    if (finalPriceValue !== null && finalPriceValue !== undefined) {
      setFinalPrice(typeof finalPriceValue === 'number' ? finalPriceValue.toString() : String(finalPriceValue));
    } else if (priceValue !== null && priceValue !== undefined) {
      setFinalPrice(typeof priceValue === 'number' ? priceValue.toString() : String(priceValue));
    } else {
      setFinalPrice('0');
    }
    setTotalKm("");
    setFuelCost("");
    setRoadCost("");
    setOtherExpenses("");
    setShowCompleteDialog(true);
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder || completing) return;

    const { netProfit, totalExpenses } = calculateNetProfit();

    if (!totalKm || !fuelCost || !roadCost || !otherExpenses || !finalPrice) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setCompleting(true);
    try {
      // Parse values - ensure they are numbers
      const km = parseFloat(totalKm) || 0;
      const fuel = parseFloat(fuelCost.replace(/[₺,\s]/g, '') || '0') || 0;
      const road = parseFloat(roadCost.replace(/[₺,\s]/g, '') || '0') || 0;
      const other = parseFloat(otherExpenses.replace(/[₺,\s]/g, '') || '0') || 0;

      // Use final_price from order (read-only, cannot be changed)
      // This ensures the price agreed upon during conversation cannot be manipulated
      const agreedFinalPrice = selectedOrder.final_price || selectedOrder.price;
      // Handle both number and string types
      const final = typeof agreedFinalPrice === 'number'
        ? agreedFinalPrice
        : parseFloat(String(agreedFinalPrice || '0').replace(/[₺,\s]/g, '')) || 0;

      // Calculate totals
      const totalExpenses = fuel + road + other;
      const netProfit = final - totalExpenses;

      // Update order with financial data and driver_completed
      // Ensure all numeric values are sent as numbers (not strings)
      // CRITICAL: final_price is NOT updated here - it's locked from the agreement phase
      const updateData = {
        driver_completed: true,
        total_km: Number(km),
        fuel_cost: Number(fuel),
        road_cost: Number(road),
        other_expenses: Number(other),
        // final_price is NOT included - it remains locked from the agreement
        net_profit: Number(netProfit)
      };

      console.log('Updating order with data:', updateData);

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id);

      if (updateError) {
        console.error('Error completing order:', updateError);
        console.error('Update data that failed:', updateData);
        toast.error(`Sevkiyat tamamlanırken bir hata oluştu: ${updateError.message}`);
        setCompleting(false);
        return;
      }

      // Check if both parties completed
      const { data: orderData, error: checkError } = await supabase
        .from('orders')
        .select('customer_completed, driver_completed, listingId')
        .eq('id', selectedOrder.id)
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
            .eq('id', selectedOrder.id);

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

        // 1. Stop Location Sharing
        try {
          await supabase
            .from('locationSharing')
            .update({ isSharing: false })
            .eq('driverId', user.id);
        } catch (locError) {
          console.error("Error stopping location share:", locError);
        }

        // 2. Update Statistics
        try {
          // Fetch existing stats
          const { data: existingStats } = await supabase
            .from('statistics')
            .select('*')
            .eq('driverId', user.id)
            .maybeSingle();

          // Helper to parse currency string safely for TR locale
          // "1.000" -> 1000, "1.000,50" -> 1000.50
          const parseMoney = (str: string | number | null | undefined) => {
            if (!str) return 0;
            if (typeof str === 'number') return str;
            // Remove all non-numeric chars except . and ,
            let cleanStr = str.toString().replace(/[^0-9.,]/g, '');
            // Remove dots (thousand separators)
            cleanStr = cleanStr.replace(/\./g, '');
            // Replace comma with dot (decimal separator)
            cleanStr = cleanStr.replace(',', '.');
            return parseFloat(cleanStr) || 0;
          };

          // Helper to format currency 1000 -> "₺1.000"
          const formatMoney = (val: number) =>
            val.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 });

          // Values from current trip
          const currentProfit = calculateNetProfit().netProfit;
          const currentExpense = calculateNetProfit().totalExpenses;
          const currentIncome = parseMoney(selectedOrder.final_price) || parseMoney(selectedOrder.price);

          if (existingStats) {
            // Update existing
            const newTotalKm = (existingStats.totalKm || 0) + (parseFloat(totalKm) || 0);
            const newTotalShipments = (existingStats.totalShipments || 0) + 1;
            const newTotalIncome = parseMoney(existingStats.totalIncome) + currentIncome;
            const newTotalExpense = parseMoney(existingStats.totalExpense) + currentExpense;
            const newNetProfit = parseMoney(existingStats.netProfit) + currentProfit;

            await supabase.from('statistics').update({
              totalKm: newTotalKm,
              totalShipments: newTotalShipments,
              totalIncome: formatMoney(newTotalIncome),
              totalExpense: formatMoney(newTotalExpense),
              netProfit: formatMoney(newNetProfit),
              updatedAt: new Date().toISOString()
            }).eq('id', existingStats.id);

          } else {
            // Create new
            await supabase.from('statistics').insert({
              driverId: user.id,
              totalKm: parseFloat(totalKm) || 0,
              totalShipments: 1,
              totalIncome: formatMoney(currentIncome),
              totalExpense: formatMoney(currentExpense),
              netProfit: formatMoney(currentProfit)
            });
          }

        } catch (statsError) {
          console.error("Error updating statistics:", statsError);
        }

        toast.success('Sevkiyat tamamlandı ve istatistikler güncellendi');
      }

      setShowCompleteDialog(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error in handleCompleteOrder:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="sofor">
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
    <DashboardLayout role="sofor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">İşlemlerim</h1>
            <p className="text-muted-foreground">Aktif ve geçmiş sevkiyatlarınızı takip edin</p>
          </div>
          {/* Driver Rating Badge */}
          {!loadingRating && (
            <Badge variant="outline" className="px-4 py-2">
              <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1">/ 5.0</span>
            </Badge>
          )}
        </div>

        {/* Aktif Sevkiyatlar */}
        {activeOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Devam Eden Sevkiyatlar
            </h2>
            {activeOrders.map((islem) => (
              <Card key={islem.id} className="border-secondary/50 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Customer Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{islem.customerName || 'Bilinmeyen Müşteri'}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/sofor/mesajlar">
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
                        className={`text-sm px-3 py-1 ${islem.status === 'Onay Bekliyor'
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
                        <Link to="/sofor/konum">
                          <MapPin className="w-4 h-4 mr-2" />
                          Konumu Takip Et
                        </Link>
                      </Button>
                      {islem.driver_completed ? (
                        <div className="text-sm text-muted-foreground text-center">
                          {islem.customer_completed
                            ? 'Sevkiyat tamamlandı'
                            : 'Karşı tarafın onayı bekleniyor...'}
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenCompleteDialog(islem)}
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

        {/* Tamamlanan Sevkiyatlar */}
        {completedOrders.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Tamamlanan Sevkiyatlar
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

            {/* Filtered Orders Table */}
            {(() => {
              // Filter completed orders
              const filteredCompleted = completedOrders.filter((order) => {
                // City search filter (case-insensitive search in both from and to)
                const cityMatch = !searchTerm.trim() ||
                  order.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  order.to.toLowerCase().includes(searchTerm.toLowerCase());

                // Date filter - compare YYYY-MM-DD format
                let dateMatch = true;
                if (filterDate && order.completedAt) {
                  // Convert completedAt to YYYY-MM-DD format
                  const completedDateStr = new Date(order.completedAt).toISOString().split('T')[0];
                  // Compare with selected date (already in YYYY-MM-DD format)
                  dateMatch = completedDateStr === filterDate;
                } else if (filterDate && !order.completedAt) {
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
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Güzergah</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Tarih</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Müşteri Adı</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Net Kar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCompleted.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{order.from}</span>
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{order.to}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {order.completedAt
                                  ? new Date(order.completedAt).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm">{order.customerName || 'Bilinmeyen Müşteri'}</td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-semibold text-green-600">
                                  {(order.net_profit || 0).toLocaleString('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
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
                <Link to="/sofor/ilan-olustur">Yeni İlan Oluştur</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Complete Order Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sevkiyatı Tamamla</DialogTitle>
            <DialogDescription>
              Sevkiyat bilgilerini girin ve giderlerinizi kaydedin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalKm">Toplam KM</Label>
                <Input
                  id="totalKm"
                  type="number"
                  placeholder="0"
                  value={totalKm}
                  onChange={(e) => setTotalKm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalPrice">Anlaşılan Fiyat (₺)</Label>
                <Input
                  id="finalPrice"
                  type="text"
                  placeholder="0"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  title="Bu fiyat anlaşma aşamasında belirlenmiştir ve değiştirilemez"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelCost">Yakıt Gideri (₺)</Label>
                <Input
                  id="fuelCost"
                  type="text"
                  placeholder="0"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roadCost">Yol Gideri (₺)</Label>
                <Input
                  id="roadCost"
                  type="text"
                  placeholder="0"
                  value={roadCost}
                  onChange={(e) => setRoadCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherExpenses">Diğer Giderler (₺)</Label>
                <Input
                  id="otherExpenses"
                  type="text"
                  placeholder="0"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                />
              </div>
            </div>

            {/* Net Profit Calculation */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Kar Hesaplama</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anlaşılan Fiyat:</span>
                    <span className="font-medium">
                      {finalPrice ? `₺${(parseFloat(finalPrice.replace(/[₺,\s]/g, '')) || 0).toLocaleString('tr-TR')}` : '₺0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Gider:</span>
                    <span className="font-medium text-red-600">
                      ₺{calculateNetProfit().totalExpenses.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Net Kar:</span>
                    <span className={`font-bold text-lg ${calculateNetProfit().netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      ₺{calculateNetProfit().netProfit.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={completing}
            >
              İptal
            </Button>
            <Button
              onClick={handleCompleteOrder}
              disabled={completing || !totalKm || !fuelCost || !roadCost || !otherExpenses || !finalPrice}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? 'Kaydediliyor...' : 'Kaydet ve Tamamla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SoforAktifIslemler;

