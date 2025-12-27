import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Truck, Package, Mail, Lock, User, ArrowRight, Eye, EyeOff, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Kayit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const roleParam = searchParams.get("rol");
  const initialRole = (roleParam === "musteri" || roleParam === "sirket") ? roleParam : "sofor";

  const [role, setRole] = useState<"sofor" | "musteri" | "sirket">(initialRole as "sofor" | "musteri" | "sirket");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    taxNo: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır!");
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.name,
      role,
      role === 'sirket' ? { name: formData.companyName, taxNo: formData.taxNo } : undefined
    );

    if (error) {
      toast.error(error.message || "Kayıt başarısız. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }

    toast.success("Kayıt başarılı! Yönlendiriliyorsunuz...");
    setTimeout(() => {
      if (role === "sofor") navigate("/sofor/panel");
      else if (role === "musteri") navigate("/musteri/panel");
      else if (role === "sirket") navigate("/sirket/panel");
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
            <CardTitle className="text-2xl">Üye Ol</CardTitle>
            <CardDescription>Hesap oluşturarak hemen başlayın</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Selection */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setRole("sofor")}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${role === "sofor"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                  }`}
              >
                <Truck className={`w-6 h-6 mb-1 ${role === "sofor" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${role === "sofor" ? "text-primary" : "text-muted-foreground"}`}>Şoför</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("musteri")}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${role === "musteri"
                  ? "border-secondary bg-secondary/5"
                  : "border-border hover:border-secondary/50"
                  }`}
              >
                <Package className={`w-6 h-6 mb-1 ${role === "musteri" ? "text-secondary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${role === "musteri" ? "text-secondary" : "text-muted-foreground"}`}>Müşteri</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("sirket")}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${role === "sirket"
                  ? "border-blue-500 bg-blue-500/5"
                  : "border-border hover:border-blue-500/50"
                  }`}
              >
                <Building2 className={`w-6 h-6 mb-1 ${role === "sirket" ? "text-blue-500" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${role === "sirket" ? "text-blue-500" : "text-muted-foreground"}`}>Şirket</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Adınız Soyadınız"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {role === 'sirket' && (
                <>
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="companyName">Şirket Adı</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="companyName"
                        placeholder="Örn: Yılmaz Lojistik"
                        className="pl-10"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required={role === 'sirket'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 delay-75">
                    <Label htmlFor="taxNo">Vergi No (İsteğe Bağlı)</Label>
                    <div className="relative">
                      <Input
                        id="taxNo"
                        placeholder="Vergi numaranız"
                        className=""
                        value={formData.taxNo}
                        onChange={(e) => setFormData({ ...formData, taxNo: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

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
                <Label htmlFor="password">Şifre</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant={role === "sofor" ? "hero" : "accent"}
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Kayıt yapılıyor..." : "Üye Ol"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Zaten hesabınız var mı?{" "}
              <Link to="/giris" className="text-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Kayit;
