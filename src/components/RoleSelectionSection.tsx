import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Package, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const RoleSelectionSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Hangi Rolde
            <span className="text-gradient"> Katılmak İstiyorsunuz?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Size uygun profili seçin ve hemen başlayın.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Driver Card */}
          <Card hover className="group overflow-hidden animate-slide-up">
            <div className="h-2 gradient-primary" />
            <CardContent className="p-8">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Şoför</h3>
              <p className="text-muted-foreground mb-6">
                Güzergah ilanları oluşturun, dönüş yolunda yük bulun ve kazancınızı artırın.
                Detaylı portföy ve metriklerle performansınızı takip edin.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Güzergah ilanı oluşturma</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Konum paylaşımı</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Gelir-gider takibi</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Profesyonel portföy</span>
                </li>
              </ul>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/kayit?rol=sofor">
                  Şoför Olarak Kayıt Ol
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card hover className="group overflow-hidden animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="h-2 gradient-secondary" />
            <CardContent className="p-8">
              <div className="w-20 h-20 rounded-2xl gradient-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-10 h-10 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Müşteri</h3>
              <p className="text-muted-foreground mb-6">
                Uygun fiyatlı nakliye hizmeti bulun. İlanları inceleyin, şoförlerle iletişime geçin
                ve sevkiyatınızı canlı takip edin.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>İlan arama ve filtreleme</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Anlık mesajlaşma</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Canlı konum takibi</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span>Şoför değerlendirme</span>
                </li>
              </ul>
              <Button variant="accent" className="w-full" asChild>
                <Link to="/kayit?rol=musteri">
                  Müşteri Olarak Kayıt Ol
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card hover className="group overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="h-2 bg-blue-500" />
            <CardContent className="p-8">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Şirket</h3>
              <p className="text-muted-foreground mb-6">
                Filonuzu ve şoförlerinizi tek panelden yönetin. Araçlarınızı takip edin
                ve operasyonel verimliliğinizi artırın.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Filo yönetimi</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Şoför performansı</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Finansal raporlama</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Kurumsal destek</span>
                </li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                <Link to="/kayit?rol=sirket">
                  Şirket Olarak Kayıt Ol
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RoleSelectionSection;
