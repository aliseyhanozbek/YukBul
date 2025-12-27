import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Calendar, Package, Truck, DollarSign, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const IlanOlustur = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    date: "", // Yükleme Tarihi (Loading Date)
    arrivalDate: "", // Tahmini Varış Tarihi (Estimated Arrival Date)
    capacity: "",
    price: "",
    vehicleType: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Giriş yapmanız gerekiyor");
      return;
    }

    // Ensure user.id is a string (UUID) - CRITICAL: Never convert to number
    if (typeof user.id !== 'string') {
      console.error('Invalid user.id type:', typeof user.id, user.id);
      toast.error("Geçersiz kullanıcı bilgisi");
      return;
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('Invalid UUID format:', user.id);
      toast.error("Geçersiz kullanıcı ID formatı");
      return;
    }

    setLoading(true);

    try {
      // Validate dates are in YYYY-MM-DD format
      if (!formData.date || !formData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        toast.error("Geçerli bir yükleme tarihi seçin");
        setLoading(false);
        return;
      }

      // Validate arrival date if provided
      if (formData.arrivalDate && !formData.arrivalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        toast.error("Geçerli bir varış tarihi seçin");
        setLoading(false);
        return;
      }

      // Validate arrival date is after loading date
      if (formData.arrivalDate && formData.date && formData.arrivalDate < formData.date) {
        toast.error("Varış tarihi yükleme tarihinden önce olamaz");
        setLoading(false);
        return;
      }

      // CRITICAL: All values must be strings as per database schema (TEXT columns)
      // Do NOT convert numbers - send everything as string
      
      // CRITICAL: user.id is already a UUID string from auth.users
      // Never use Number(), parseInt(), or any conversion - send as-is
      const driverIdValue: string = user.id; // Explicitly typed as string

      // Prepare insert data matching exact database column names (case-sensitive)
      // Column names: "driverId", "from", "to", date, capacity, "vehicleType", price, description, arrival_date
      const insertData: any = {
        "driverId": driverIdValue, // UUID string from auth.user.id - NEVER convert to number
        "from": formData.from.trim(), // TEXT - string
        "to": formData.to.trim(), // TEXT - string
        date: formData.date, // TEXT - YYYY-MM-DD format string (already in correct format from input type="date")
        capacity: formData.capacity.trim(), // TEXT - string (no formatting, send as-is)
        "vehicleType": formData.vehicleType.trim() || null, // TEXT - string or null
        price: formData.price.trim(), // TEXT - string (no currency symbol, no formatting, send as-is)
        description: formData.description.trim() || null // TEXT - string or null
      };

      // Add arrival_date if provided (snake_case as per database schema)
      if (formData.arrivalDate) {
        insertData.arrival_date = formData.arrivalDate; // TEXT - YYYY-MM-DD format string
      }

      const { error } = await supabase
        .from('listings')
        .insert(insertData);

      if (error) {
        console.error('Error creating listing:', error);
        console.error('Insert data sent:', insertData);
        toast.error("İlan oluşturulurken bir hata oluştu: " + error.message);
        setLoading(false);
        return;
      }

      toast.success("İlan başarıyla oluşturuldu!");
      
      // Navigate to listings page after short delay
      setTimeout(() => {
        navigate("/sofor/ilanlar");
      }, 500);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error("İlan oluşturulurken bir hata oluştu");
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="sofor">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Yeni İlan Oluştur</h1>
          <p className="text-muted-foreground">Güzergah bilgilerinizi girerek ilan oluşturun</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Güzergah Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">Kalkış Noktası</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input 
                      id="from"
                      placeholder="Örn: İstanbul"
                      className="pl-10"
                      value={formData.from}
                      onChange={(e) => setFormData({...formData, from: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">Varış Noktası</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                    <Input 
                      id="to"
                      placeholder="Örn: Ankara"
                      className="pl-10"
                      value={formData.to}
                      onChange={(e) => setFormData({...formData, to: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date & Capacity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Yükleme Tarihi</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="date"
                      type="date"
                      className="pl-10"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalDate">Tahmini Varış Tarihi</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="arrivalDate"
                      type="date"
                      className="pl-10"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})}
                      min={formData.date || new Date().toISOString().split('T')[0]} // Must be after loading date
                    />
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Boş Kapasite (Kg)</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="capacity"
                      type="number"
                      placeholder="Örn: 1000 Kg"
                      min="0"
                      step="0.1"
                      className="pl-10"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle & Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Araç Tipi</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="vehicleType"
                      placeholder="Örn: Kapalı Kasa TIR"
                      className="pl-10"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Başlangıç Fiyatı (₺)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="price"
                      type="number"
                      placeholder="Örn: 2500"
                      className="pl-10"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama (İsteğe Bağlı)</Label>
                <Textarea 
                  id="description"
                  placeholder="İlan hakkında ek bilgiler..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  İlanınız yayınlandıktan sonra müşteriler sizinle iletişime geçebilir. 
                  Fiyat pazarlığı mesajlaşma üzerinden yapılacaktır.
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                  İptal
                </Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Yükleniyor...
                    </span>
                  ) : (
                    "İlanı Yayınla"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IlanOlustur;
