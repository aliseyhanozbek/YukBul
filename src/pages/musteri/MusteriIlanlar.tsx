import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { 
  Search, MapPin, Calendar, Package, Star, User, Filter,
  ArrowUpDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getOrCreateConversation } from "@/utils/conversationUtils";
import { toast } from "sonner";

interface Listing {
  id: number;
  driverId: string | null;
  driver: string;
  rating: number;
  reviews: number;
  from: string;
  to: string;
  date: string;
  capacity: string;
  vehicleType: string | null;
  price: string;
  views: number;
}

// Format date to user-friendly format (e.g., "15 Haz 2024")
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
    // Parse YYYY-MM-DD format
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const months = [
      'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
      'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const MusteriIlanlar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [ilanlar, setIlanlar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedListingIds, setViewedListingIds] = useState<Set<number>>(new Set());
  const [handlingConversation, setHandlingConversation] = useState<number | null>(null);

  // Read URL parameters on mount and when they change
  useEffect(() => {
    const fromParam = searchParams.get('from') || '';
    const toParam = searchParams.get('to') || '';
    const dateParam = searchParams.get('date') || '';

    setSearchFrom(fromParam);
    setSearchTo(toParam);

    // Fetch listings with filters
    fetchListings(fromParam, toParam, dateParam);
  }, [searchParams]);

  const fetchListings = async (fromFilter?: string, toFilter?: string, dateFilter?: string) => {
    try {
      setLoading(true);
      
      // Start building the query
      let query = supabase
        .from('listings')
        .select(`
          id,
          driverId,
          from,
          to,
          date,
          capacity,
          vehicleType,
          price,
          views,
          status
        `)
        .eq('status', 'Aktif');

      // Apply filters if provided
      if (fromFilter && fromFilter.trim()) {
        query = query.ilike('from', `%${fromFilter.trim()}%`);
      }
      if (toFilter && toFilter.trim()) {
        query = query.ilike('to', `%${toFilter.trim()}%`);
      }
      if (dateFilter && dateFilter.trim()) {
        query = query.eq('date', dateFilter.trim());
      }

      // Order by creation date
      query = query.order('createdAt', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
        toast.error('İlanlar yüklenirken bir hata oluştu');
        return;
      }

      if (data) {
        // Fetch driver information for each listing
        const listingsWithDrivers = await Promise.all(
          data.map(async (listing) => {
            if (!listing.driverId) {
              return null;
            }

            // Get driver profile
            const { data: driverProfile } = await supabase
              .from('users')
              .select('name')
              .eq('id', listing.driverId)
              .single();

            // Calculate driver rating from reviews table
            let avgRating = 0;
            let reviewCount = 0;
            
            const { data: reviewsData, error: reviewsError } = await supabase
              .from('reviews')
              .select('rating')
              .eq('driverId', listing.driverId);

            if (!reviewsError && reviewsData && reviewsData.length > 0) {
              const totalRating = reviewsData.reduce((sum, review) => sum + Number(review.rating), 0);
              avgRating = totalRating / reviewsData.length;
              reviewCount = reviewsData.length;
            }

            return {
              id: listing.id,
              driverId: listing.driverId,
              driver: driverProfile?.name || 'Bilinmeyen Şoför',
              rating: avgRating,
              reviews: reviewCount,
              from: listing.from,
              to: listing.to,
              date: listing.date,
              capacity: listing.capacity,
              vehicleType: listing.vehicleType,
              price: listing.price,
              views: listing.views || 0
            };
          })
        );

        const validListings = listingsWithDrivers.filter(
          (listing): listing is Listing => listing !== null
        );

        setIlanlar(validListings);
      } else {
        setIlanlar([]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('İlanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Function to increment views count (only if viewer is not the owner)
  const incrementViews = async (listingId: number, driverId: string | null) => {
    // Skip if already viewed in this session
    if (viewedListingIds.has(listingId)) {
      return;
    }

    // Skip if current user is the owner
    if (user?.id && driverId === user.id) {
      return;
    }

    try {
      // Use RPC function to increment views
      const { error: rpcError } = await supabase.rpc('increment_listing_views', {
        listing_id: listingId
      });

      if (rpcError) {
        // If RPC fails, silently log error (no user notification)
        console.error('Error incrementing listing views:', rpcError);
        return;
      }

      // Mark as viewed to prevent duplicate increments
      setViewedListingIds(prev => new Set(prev).add(listingId));

      // Update local state to reflect the change
      setIlanlar(prevIlanlar =>
        prevIlanlar.map(ilan => {
          if (ilan.id === listingId) {
            return { ...ilan, views: (ilan.views || 0) + 1 };
          }
          return ilan;
        })
      );
    } catch (error) {
      // Silently log error (no user notification)
      console.error('Error incrementing views:', error);
    }
  };

  // Increment views when listing cards are viewed (on page load)
  // Only increment once per listing per session
  useEffect(() => {
    if (!loading && ilanlar.length > 0 && user?.id) {
      // Increment views for all listings that are not owned by current user
      ilanlar.forEach((listing) => {
        if (listing.driverId !== user.id) {
          incrementViews(listing.id, listing.driverId);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // Only run when loading completes

  // Filter listings based on local search (for real-time filtering on the page)
  const filteredIlanlar = ilanlar.filter(ilan => {
    const matchFrom = !searchFrom || ilan.from.toLowerCase().includes(searchFrom.toLowerCase());
    const matchTo = !searchTo || ilan.to.toLowerCase().includes(searchTo.toLowerCase());
    return matchFrom && matchTo;
  });

  return (
    <DashboardLayout role="musteri">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">İlanları Görüntüle</h1>
          <p className="text-muted-foreground">Uygun nakliye ilanlarını bulun ve iletişime geçin</p>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input 
                  placeholder="Kalkış noktası ara..." 
                  className="pl-10"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <Input 
                  placeholder="Varış noktası ara..." 
                  className="pl-10"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Yükleniyor...' : filteredIlanlar.length > 0 ? `${filteredIlanlar.length} ilan bulundu` : 'İlan bulunamadı'}
          </p>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredIlanlar.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aradığınız kriterlere uygun ilan bulunamadı</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Farklı arama kriterleri deneyebilir veya tüm ilanları görüntüleyebilirsiniz.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchFrom('');
                    setSearchTo('');
                    navigate('/musteri/ilanlar');
                    fetchListings();
                  }}
                >
                  Tüm İlanları Görüntüle
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredIlanlar.map((ilan, index) => (
            <Card 
              key={ilan.id} 
              hover 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Driver Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{ilan.driver}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{ilan.rating > 0 ? ilan.rating.toFixed(1) : '0.0'}</span>
                        <span>({ilan.reviews} değerlendirme)</span>
                      </div>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="flex-1 lg:px-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="font-medium">{ilan.from}</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary rounded" />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                        <span className="font-medium">{ilan.to}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(ilan.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {ilan.capacity} Kg
                      </span>
                      {ilan.vehicleType && <span className="ml-4">{ilan.vehicleType}</span>}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-secondary">{ilan.price}</div>
                      <div className="text-xs text-muted-foreground">başlangıç fiyatı</div>
                    </div>
                    <Button 
                      variant="default" 
                      onClick={async () => {
                        if (!user?.id || typeof user.id !== 'string') {
                          toast.error('Giriş yapmanız gerekiyor');
                          return;
                        }

                        if (handlingConversation === ilan.id) {
                          return; // Already handling
                        }

                        setHandlingConversation(ilan.id);
                        
                        const conversationId = await getOrCreateConversation(user.id, ilan.id);
                        setHandlingConversation(null);

                        if (conversationId) {
                          navigate(`/musteri/mesajlar?conversationId=${conversationId}`);
                        }
                      }}
                      disabled={handlingConversation === ilan.id}
                    >
                      {handlingConversation === ilan.id ? 'Yükleniyor...' : 'İletişim Kur'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MusteriIlanlar;
