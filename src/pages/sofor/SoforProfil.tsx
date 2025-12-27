import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User, Star, Truck, MapPin, Phone, Mail, Camera,
  Edit2, Save, Award, Route, Calendar, Building2, LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";

const SoforProfil = () => {
  const { user } = useAuth();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingRating, setLoadingRating] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle: "",
    plate: "",
    bio: "",
    role: "sofor" as 'musteri' | 'sofor',
    company_id: null as string | null
  });
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyIdInput, setCompanyIdInput] = useState("");
  const [joiningCompany, setJoiningCompany] = useState(false);

  // Load profile data when userProfile is available
  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || user?.email || "",
        phone: userProfile.phone || "",
        vehicle: userProfile.vehicle || "",
        plate: userProfile.plate || "",
        bio: userProfile.bio || "",
        role: userProfile.role || "sofor",
        company_id: userProfile.company_id || null
      });
      if (userProfile.company_id) {
        fetchCompanyName(userProfile.company_id);
      }
    } else if (user) {
      // If profile doesn't exist yet, initialize with user data
      setProfile({
        name: user.user_metadata?.display_name || "",
        email: user.email || "",
        phone: "",
        vehicle: "",
        plate: "",
        bio: "",
        role: user.user_metadata?.role || "sofor",
        company_id: null
      });
    }
  }, [userProfile, user]);

  // Fetch average rating from reviews table
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
          const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
          const average = totalRating / reviewsData.length;
          setAvgRating(average);
          setTotalReviews(reviewsData.length);
        } else {
          setAvgRating(0);
          setTotalReviews(0);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      } finally {
        setLoadingRating(false);
      }
    };

    fetchRating();
    fetchRating();
  }, [user?.id]);

  const fetchCompanyName = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      if (data) {
        setCompanyName(data.name);
      }
    } catch (error) {
      console.error("Error fetching company name:", error);
    }
  };

  const handleJoinCompany = async () => {
    if (!companyIdInput.trim()) {
      toast.error("Lütfen bir Şirket ID giriniz!");
      return;
    }

    setJoiningCompany(true);
    try {
      // 1. Verify Company Exists
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyIdInput.trim())
        .single();

      if (companyError || !company) {
        toast.error("Şirket bulunamadı! ID'yi kontrol ediniz.");
        setJoiningCompany(false);
        return;
      }

      // 2. Update User
      const { error: updateError } = await supabase
        .from('users')
        .update({ company_id: company.id })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(`${company.name} şirketine katıldınız!`);
      setProfile({ ...profile, company_id: company.id });
      setCompanyName(company.name);
      setCompanyIdInput("");
    } catch (error: any) {
      toast.error("Hata oluştu: " + error.message);
    } finally {
      setJoiningCompany(false);
    }
  };

  const handleLeaveCompany = async () => {
    if (!confirm("Şirketten ayrılmak istediğinize emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ company_id: null })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Şirketten ayrıldınız.");
      setProfile({ ...profile, company_id: null });
      setCompanyName(null);
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    }
  };

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
        name: profile.name || null,
        phone: profile.phone || null,
        vehicle: profile.vehicle || null,
        plate: profile.plate || null,
        bio: profile.bio || null,
        role: profile.role || user.user_metadata?.role || 'sofor', // Get from profile, metadata, or default
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

  const reviews = [
    { id: 1, customer: "Ayşe D.", rating: 5, comment: "Çok ilgili ve zamanında teslim etti. Teşekkürler!", date: "2 gün önce" },
    { id: 2, customer: "Fatma Y.", rating: 5, comment: "Eşyalarıma çok özen gösterdi, memnun kaldım.", date: "1 hafta önce" },
    { id: 3, customer: "Ali K.", rating: 4, comment: "İyi hizmet, biraz geç kaldı ama sorun çıkarmadı.", date: "2 hafta önce" },
  ];

  return (
    <DashboardLayout role="sofor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Profilim</h1>
            <p className="text-muted-foreground">Profil bilgilerinizi yönetin</p>
          </div>
          <Button
            variant={isEditing ? "hero" : "outline"}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
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
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center flex flex-col justify-center min-h-full">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold mb-2">
                {profileLoading ? "Yükleniyor..." : (profile.name || user?.email?.split('@')[0] || "Kullanıcı")}
              </h2>
              <div className="flex items-center justify-center gap-1 mb-6">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">
                  {loadingRating ? "..." : avgRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({loadingRating ? "..." : totalReviews} değerlendirme)
                </span>
              </div>

              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Onaylı Şoför</span>
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Pro Üye</span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Profil Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Adınız Soyadınız"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={profile.email}
                      disabled={true}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Telefon numaranız"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Plaka</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={profile.plate}
                      onChange={(e) => setProfile({ ...profile, plate: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Araç plakanız"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Araç Bilgisi</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={profile.vehicle}
                    onChange={(e) => setProfile({ ...profile, vehicle: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Araç tipi ve modeli"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hakkımda</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Kendiniz hakkında bilgi verin..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Section */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Şirket / Filo Yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.company_id ? (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{companyName || 'Şirket Yükleniyor...'}</h3>
                      <p className="text-sm text-muted-foreground">Bu şirkete kayıtlısınız</p>
                    </div>
                  </div>
                  <Button variant="destructive" onClick={handleLeaveCompany}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Ayrıl
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <Label>Şirket ID ile Katıl</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Şirket yöneticisinden aldığınız ID'yi girin (örn: 123e4567...)"
                        className="pl-10"
                        value={companyIdInput}
                        onChange={(e) => setCompanyIdInput(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bir lojistik filosuna veya şirkete bağlı çalışıyorsanız, yöneticinizden alacağınız ID kodu ile giriş yapabilirsiniz.
                    </p>
                  </div>
                  <Button onClick={handleJoinCompany} disabled={joiningCompany} className="w-full md:w-auto">
                    {joiningCompany ? "Katılınıyor..." : "Şirkete Katıl"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SoforProfil;
