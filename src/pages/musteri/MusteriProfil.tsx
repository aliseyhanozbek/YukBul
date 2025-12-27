import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, MapPin, Edit2, Save, Camera,
  Package, Calendar, TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";

const MusteriProfil = () => {
  const { user } = useAuth();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: ""
  });
  const [totalShipments, setTotalShipments] = useState(0);
  const [totalSpent, setTotalSpent] = useState("₺0");
  const [loadingStats, setLoadingStats] = useState(true);

  // Load profile data when userProfile is available
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        email: userProfile.email || user?.email || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        bio: userProfile.bio || ""
      });
    } else if (user) {
      // If profile doesn't exist yet, initialize with user data
      setFormData({
        name: user.user_metadata?.display_name || "",
        email: user.email || "",
        phone: "",
        address: "",
        bio: ""
      });
    }
  }, [userProfile, user]);

  // Fetch statistics from orders table
  useEffect(() => {
    const fetchCustomerStats = async () => {
      if (!user?.id) {
        setLoadingStats(false);
        return;
      }

      try {
        // Fetch completed orders for this customer
        // Only get orders with completedAt (not null) to ensure they are truly completed
        const { data: completedOrders, error } = await supabase
          .from('orders')
          .select('final_price, completedAt, status')
          .eq('customerId', user.id)
          .eq('status', 'Tamamlandı')
          .not('completedAt', 'is', null);

        if (error) {
          console.error('Error fetching customer statistics:', error);
          setLoadingStats(false);
          return;
        }

        // Calculate total shipments count
        const shipmentsCount = completedOrders?.length || 0;
        setTotalShipments(shipmentsCount);

        // Calculate total spent from final_price
        let totalSpentAmount = 0;
        if (completedOrders) {
          completedOrders.forEach((order) => {
            if (order.final_price) {
              // Handle both string and number types
              const priceNum = typeof order.final_price === 'string' 
                ? parseFloat(order.final_price.toString().replace(/[₺,\s]/g, ''))
                : Number(order.final_price);
              if (!isNaN(priceNum)) {
                totalSpentAmount += priceNum;
              }
            }
          });
        }

        // Format currency
        const formattedTotal = totalSpentAmount.toLocaleString('tr-TR', {
          style: 'currency',
          currency: 'TRY',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        setTotalSpent(formattedTotal);
      } catch (error) {
        console.error('Error fetching customer statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchCustomerStats();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Kullanıcı bilgisi bulunamadı!");
      return;
    }

    setSaving(true);
    
    // Ensure user.id is a string (UUID)
    if (!user.id || typeof user.id !== 'string') {
      toast.error("Geçersiz kullanıcı bilgisi!");
      setSaving(false);
      return;
    }

    // Use upsert to create profile if it doesn't exist
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id, // UUID string
        email: user.email || '',
        name: formData.name || null,
        phone: formData.phone || null,
        address: formData.address || null,
        bio: formData.bio || null,
        role: userProfile?.role || user.user_metadata?.role || 'musteri', // Get from profile, metadata, or default
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      toast.error("Profil güncellenirken bir hata oluştu: " + error.message);
      setSaving(false);
      return;
    }

    setIsEditing(false);
    setSaving(false);
    toast.success("Profil başarıyla güncellendi!");
  };

  return (
    <DashboardLayout role="musteri">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Profilim</h1>
            <p className="text-muted-foreground">Hesap bilgilerinizi yönetin</p>
          </div>
          <Button 
            variant={isEditing ? "secondary" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving || profileLoading}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Düzenle
              </>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar & Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User className="w-12 h-12 text-secondary" />
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-bold">
                      {profileLoading ? "Yükleniyor..." : (formData.name || user?.email?.split('@')[0] || "Kullanıcı")}
                    </h2>
                    <p className="text-muted-foreground">{formData.email || "Yükleniyor..."}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                      <Badge variant="secondary">Onaylı Müşteri</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Adınız Soyadınız"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Telefon numaranız"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Adresiniz"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Hakkımda</Label>
                  <Textarea 
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Kendiniz hakkında bilgi verin..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            {/* Stats Cards */}
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {loadingStats ? "..." : totalShipments}
                    </div>
                    <div className="text-sm text-muted-foreground">Toplam Sevkiyat</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {loadingStats ? "..." : totalSpent}
                    </div>
                    <div className="text-sm text-muted-foreground">Toplam Harcama</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {userProfile?.memberSince || user?.created_at ? 
                        new Date(user.created_at || "").toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) 
                        : "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">Üyelik Başlangıcı</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hesap İşlemleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Şifre Değiştir
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Bildirim Ayarları
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Hesabı Sil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MusteriProfil;
