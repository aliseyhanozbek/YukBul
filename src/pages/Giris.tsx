import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const Giris = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("=== Login Form Submit ===");
    console.log("Attempting to sign in with email:", formData.email);

    try {
      // Step 1: Sign in with email and password
      const { error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        console.error("Sign in error received:", signInError);

        // Detaylı hata mesajları
        let errorMessage = "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";

        if (signInError.status === 401) {
          if (signInError.message?.includes('Invalid API key') || signInError.message?.includes('JWT')) {
            errorMessage = "API anahtarı geçersiz. Lütfen .env.local dosyanızı kontrol edin.";
            console.error("API Key Error - Check console for details");
          } else if (signInError.message?.includes('Invalid login credentials')) {
            errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
          } else {
            errorMessage = `Yetkilendirme hatası (401): ${signInError.message || 'Geçersiz kimlik bilgileri'}`;
          }
        } else if (signInError.message?.includes('fetch') || signInError.message?.includes('network')) {
          errorMessage = "Bağlantı hatası. İnternet bağlantınızı ve Supabase URL'inizi kontrol edin.";
        } else {
          errorMessage = signInError.message || errorMessage;
        }

        toast.error(errorMessage);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Unexpected error in handleSubmit:", err);
      toast.error("Beklenmeyen bir hata oluştu. Lütfen konsolu kontrol edin.");
      setLoading(false);
      return;
    }

    // Step 2: Get the current authenticated user from Supabase
    // Use getUser() to get the current user after successful sign-in
    const { data: userData, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !userData?.user) {
      console.error('Error getting user:', getUserError);
      toast.error("Kullanıcı bilgisi alınamadı. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }

    const currentUser = userData.user;

    // Step 3: Validate that user.id is a string (UUID)
    if (!currentUser.id || typeof currentUser.id !== 'string') {
      console.error('Invalid user ID type:', typeof currentUser.id, currentUser.id);
      toast.error("Geçersiz kullanıcı bilgisi!");
      setLoading(false);
      return;
    }

    // Step 4: Get user profile from public.users table to determine role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id) // Use UUID from auth.users
      .maybeSingle(); // Use maybeSingle to handle missing profiles gracefully

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Don't block login if profile fetch fails - use default role
      toast.warning("Profil bilgisi alınamadı, varsayılan sayfaya yönlendiriliyorsunuz...");
    }

    toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");

    // Step 5: Navigate based on user role
    // Default to driver panel if role is not found
    const redirectPath = userProfile?.role === 'musteri'
      ? '/musteri/panel'
      : userProfile?.role === 'sirket'
        ? '/sirket/panel'
        : '/sofor/panel';

    setTimeout(() => {
      navigate(redirectPath);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
            <Truck className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Yükbul</span>
        </Link>

        <Card className="animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Giriş Yap</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                  <a href="#" className="text-sm text-primary hover:underline">Şifremi Unuttum</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>


            <p className="text-center text-sm text-muted-foreground mt-6">
              Hesabınız yok mu?{" "}
              <Link to="/kayit" className="text-primary hover:underline font-medium">
                Üye Ol
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Giris;
