import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { 
  Package, Calendar, Trash2, Edit2, Eye,
  Plus, Clock, ArrowRight, MapPin, Truck, DollarSign, Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Listing {
  id: number;
  from: string;
  to: string;
  date: string;
  arrival_date: string | null;
  capacity: string;
  price: string;
  status: 'Aktif' | 'Beklemede' | 'Tamamlandı' | 'İptal';
  views: number;
  messages: number;
  description: string | null;
}

// Format date to user-friendly format (e.g., "15 Haz 2024")
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
    // Parse YYYY-MM-DD format
    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if invalid
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
    return dateString; // Return as-is if error
  }
};

const SoforIlanlar = () => {
  const { user } = useAuth();
  const [ilanlar, setIlanlar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    from: "",
    to: "",
    date: "",
    arrivalDate: "",
    capacity: "",
    price: "",
    vehicleType: "",
    description: ""
  });

  // Define fetchListings BEFORE useEffect hooks to avoid initialization error
  const fetchListings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Ensure user.id is a string (UUID)
    if (typeof user.id !== 'string') {
      console.error('Invalid user ID type:', typeof user.id);
      toast.error('Geçersiz kullanıcı bilgisi');
      setLoading(false);
      return;
    }

    try {
      // Only fetch listings with status 'Aktif' or 'Beklemede'
      // Use .neq() to explicitly exclude 'Tamamlandı' status
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('driverId', user.id) // user.id is UUID string
        .neq('status', 'Tamamlandı')
        .neq('status', 'İptal')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        toast.error('İlanlar yüklenirken bir hata oluştu');
        setLoading(false);
        return;
      }

      if (data) {
        // Additional client-side filter to ensure 'Tamamlandı' listings never enter state
        const formattedListings: Listing[] = data
          .filter((listing) => listing.status !== 'Tamamlandı' && listing.status !== 'İptal')
          .map((listing) => ({
            id: listing.id,
            from: listing.from,
            to: listing.to,
            date: listing.date,
            arrival_date: listing.arrival_date || null,
            capacity: listing.capacity,
            price: listing.price,
            status: listing.status,
            views: listing.views || 0,
            messages: listing.messages || 0,
            description: listing.description || null
          }));
        setIlanlar(formattedListings);
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

  // Initial fetch on mount and when user changes
  useEffect(() => {
    fetchListings();
  }, [user?.id]);

  // Refresh listings when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && !loading) {
        fetchListings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);


  const handleEdit = (ilan: Listing) => {
    // Fetch full listing data including vehicleType and description
    const fetchFullListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', ilan.id)
          .maybeSingle();

        if (error || !data) {
          toast.error('İlan bilgileri yüklenirken bir hata oluştu');
          return;
        }

        // Set editing listing and form data
        setEditingListing(ilan);
        setEditFormData({
          from: data.from || "",
          to: data.to || "",
          date: data.date || "",
          arrivalDate: data.arrival_date || "",
          capacity: data.capacity || "",
          price: data.price || "",
          vehicleType: data.vehicleType || "",
          description: data.description || ""
        });
        setIsEditDialogOpen(true);
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast.error('İlan bilgileri yüklenirken bir hata oluştu');
      }
    };

    fetchFullListing();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !editingListing) {
      toast.error("Kullanıcı bilgisi bulunamadı");
      return;
    }

    // Ensure user.id is a string (UUID)
    if (typeof user.id !== 'string') {
      toast.error("Geçersiz kullanıcı bilgisi");
      return;
    }

    // Validate dates
    if (!editFormData.date || !editFormData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      toast.error("Geçerli bir yükleme tarihi seçin");
      return;
    }

    if (editFormData.arrivalDate && !editFormData.arrivalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      toast.error("Geçerli bir varış tarihi seçin");
      return;
    }

    if (editFormData.arrivalDate && editFormData.date && editFormData.arrivalDate < editFormData.date) {
      toast.error("Varış tarihi yükleme tarihinden önce olamaz");
      return;
    }

    setUpdating(true);

    try {
      // Prepare update data
      const updateData: any = {
        "from": editFormData.from.trim(),
        "to": editFormData.to.trim(),
        date: editFormData.date,
        capacity: editFormData.capacity.trim(),
        "vehicleType": editFormData.vehicleType.trim() || null,
        price: editFormData.price.trim(),
        description: editFormData.description.trim() || null,
        updatedAt: new Date().toISOString()
      };

      // Add arrival_date if provided
      if (editFormData.arrivalDate) {
        updateData.arrival_date = editFormData.arrivalDate;
      } else {
        updateData.arrival_date = null;
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', editingListing.id)
        .eq('driverId', user.id); // Security check

      if (error) {
        console.error('Error updating listing:', error);
        toast.error("İlan güncellenirken bir hata oluştu: " + error.message);
        setUpdating(false);
        return;
      }

      toast.success("İlan başarıyla güncellendi!");
      setIsEditDialogOpen(false);
      setEditingListing(null);
      
      // Refresh the list
      fetchListings();
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error("İlan güncellenirken bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    // Ensure user.id is a string (UUID)
    if (typeof user.id !== 'string') {
      toast.error('Geçersiz kullanıcı bilgisi');
      return;
    }

    // Confirm deletion
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
      return;
    }

    setDeletingId(id);

    try {
      // First verify that the listing belongs to the current user
      const { data: listing, error: checkError } = await supabase
        .from('listings')
        .select('driverId')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle to handle missing listings gracefully

      if (checkError || !listing) {
        toast.error('İlan bulunamadı');
        setDeletingId(null);
        return;
      }

      // Ensure driverId is a string for comparison
      const driverId = listing.driverId;
      if (typeof driverId !== 'string' || driverId !== user.id) {
        toast.error('Bu ilanı silme yetkiniz yok');
        setDeletingId(null);
        return;
      }

      // Delete the listing
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('driverId', user.id); // user.id is UUID string - Double check for security

      if (deleteError) {
        console.error('Error deleting listing:', deleteError);
        toast.error('İlan silinirken bir hata oluştu');
        setDeletingId(null);
        return;
      }

      toast.success('İlan başarıyla silindi');
      // Refresh the list
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('İlan silinirken bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <DashboardLayout role="sofor">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">İlanlarım</h1>
            <p className="text-muted-foreground">Oluşturduğunuz güzergah ilanlarını yönetin</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/sofor/ilan-olustur">
              <Plus className="w-4 h-4 mr-2" />
              Yeni İlan
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="h-8 bg-muted rounded w-24" />
                      <div className="h-10 bg-muted rounded w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Additional client-side filter to ensure 'Tamamlandı' listings never appear */}
            {ilanlar
              .filter((ilan) => ilan.status !== 'Tamamlandı' && ilan.status !== 'İptal')
              .map((ilan, index) => (
              <Card 
                key={ilan.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Route Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <span className="font-semibold text-lg">{ilan.from}</span>
                        </div>
                        <div className="flex-1 max-w-24 h-0.5 bg-gradient-to-r from-primary to-secondary rounded" />
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-secondary" />
                          <span className="font-semibold text-lg">{ilan.to}</span>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {/* Date Information - Kalkış ve Varış */}
                        <div className="flex flex-wrap items-center gap-2.5 text-sm">
                          {/* Kalkış Tarihi */}
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className="text-muted-foreground/80 text-xs font-medium">Kalkış:</span>
                            <span className="text-muted-foreground font-medium">
                              {formatDate(ilan.date)}
                            </span>
                          </div>
                          
                          {/* Ok İşareti (sadece varış tarihi varsa) */}
                          {ilan.arrival_date && (
                            <>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                              {/* Varış Tarihi */}
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                                <span className="text-muted-foreground/80 text-xs font-medium">Varış:</span>
                                <span className="text-muted-foreground font-medium">
                                  {formatDate(ilan.arrival_date)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Additional Info - Kapasite */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/70">
                          <span className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-muted-foreground/60" />
                            <span className="text-muted-foreground/80">{ilan.capacity} Kg</span>
                          </span>
                        </div>

                        {/* Açıklama */}
                        {ilan.description && ilan.description.trim() && (
                          <div className="mt-3 p-2 bg-gray-50 border border-gray-100 rounded-md">
                            <div className="flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-gray-500">
                                <span className="font-medium text-gray-600">Açıklama:</span>{" "}
                                {ilan.description.length > 60 
                                  ? `${ilan.description.substring(0, 60)}...` 
                                  : ilan.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Price */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-secondary">{ilan.price}</div>
                        <div className="flex flex-col items-end gap-1.5 mt-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            ilan.status === "Aktif" 
                              ? "bg-green-100 text-green-700" 
                              : ilan.status === "Beklemede"
                              ? "bg-yellow-100 text-yellow-700"
                              : ilan.status === "Tamamlandı"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {ilan.status}
                          </span>
                          {/* Görüntülenme Sayacı - Küçük font, fiyatın altında */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                            <Eye className="w-3 h-3" />
                            <span>{ilan.views} görüntülenme</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {ilan.messages > 0 && (
                          <Button variant="default" size="sm" asChild>
                            <Link to="/sofor/mesajlar">
                              {ilan.messages} Mesaj
                            </Link>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(ilan)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ilan.id)}
                          disabled={deletingId === ilan.id}
                        >
                          {deletingId === ilan.id ? (
                            <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && ilanlar.filter((ilan) => ilan.status !== 'Tamamlandı' && ilan.status !== 'İptal').length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz bir ilan oluşturmadınız</h3>
              <p className="text-muted-foreground mb-4">
                İlk güzergah ilanınızı oluşturun.
              </p>
              <Button variant="hero" asChild>
                <Link to="/sofor/ilan-olustur">İlan Oluştur</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                İlanı Düzenle
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Route */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-from">Kalkış Noktası</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input 
                      id="edit-from"
                      placeholder="Örn: İstanbul"
                      className="pl-10"
                      value={editFormData.from}
                      onChange={(e) => setEditFormData({...editFormData, from: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-to">Varış Noktası</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                    <Input 
                      id="edit-to"
                      placeholder="Örn: Ankara"
                      className="pl-10"
                      value={editFormData.to}
                      onChange={(e) => setEditFormData({...editFormData, to: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date & Capacity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Yükleme Tarihi</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="edit-date"
                      type="date"
                      className="pl-10"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-arrivalDate">Tahmini Varış Tarihi</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="edit-arrivalDate"
                      type="date"
                      className="pl-10"
                      value={editFormData.arrivalDate}
                      onChange={(e) => setEditFormData({...editFormData, arrivalDate: e.target.value})}
                      min={editFormData.date || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Boş Kapasite (Kg)</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="edit-capacity"
                      type="number"
                      placeholder="Örn: 1000 Kg"
                      min="0"
                      step="0.1"
                      className="pl-10"
                      value={editFormData.capacity}
                      onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle & Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicleType">Araç Tipi</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="edit-vehicleType"
                      placeholder="Örn: Kapalı Kasa TIR"
                      className="pl-10"
                      value={editFormData.vehicleType}
                      onChange={(e) => setEditFormData({...editFormData, vehicleType: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Başlangıç Fiyatı (₺)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="edit-price"
                      type="number"
                      placeholder="Örn: 2500"
                      className="pl-10"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Açıklama (İsteğe Bağlı)</Label>
                <Textarea 
                  id="edit-description"
                  placeholder="İlan hakkında ek bilgiler..."
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                />
              </div>

              {/* Actions */}
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingListing(null);
                  }}
                  disabled={updating}
                >
                  İptal
                </Button>
                <Button type="submit" variant="hero" disabled={updating}>
                  {updating ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Güncelleniyor...
                    </span>
                  ) : (
                    "Güncelle"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SoforIlanlar;
