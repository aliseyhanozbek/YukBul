import { Truck, ArrowRight, MapPin, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Truck className="w-4 h-4" />
              <span>Nakliyeciler için akıllı çözüm</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Boş Dönüşe
              <span className="text-gradient block">Son Verin</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              Şoförler ve müşterileri buluşturan platform. Dönüş yolunda yük bulun,
              maliyetlerinizi düşürün, kazancınızı artırın.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" size="xl" asChild>
                <Link to="/kayit">
                  Hemen Başla
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="#nasil-calisir">
                  Nasıl Çalışır?
                </Link>
              </Button>
            </div>


          </div>

          {/* Right Content - Floating Cards */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[500px]">
              {/* Main Card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-card rounded-2xl shadow-xl p-6 border border-border animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Mehmet Yılmaz</div>
                    <div className="text-sm text-muted-foreground">⭐ 4.9 (127 değerlendirme)</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>İstanbul → Ankara</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <span>15 Aralık 2024</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span>8 m³ boş kapasite</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-lg font-bold text-secondary">₺2,500</span>
                  <Button size="sm" variant="default">İletişim Kur</Button>
                </div>
              </div>

              {/* Floating Badge 1 */}
              <div className="absolute top-10 right-10 px-4 py-2 bg-card rounded-xl shadow-lg border border-border animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Canlı Konum</span>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute bottom-20 left-0 px-4 py-3 bg-card rounded-xl shadow-lg border border-border animate-float" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center">
                    <Package className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Yeni Anlaşma!</div>
                    <div className="text-xs text-muted-foreground">₺1,800 kazanç</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
