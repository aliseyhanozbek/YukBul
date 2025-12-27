import { Truck, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="iletisim" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Yükbul</span>
            </Link>
            <p className="text-background/70 mb-6">
              Nakliyeciler ve müşterileri buluşturan akıllı platform. 
              Boş dönüşe son verin, kazancınızı artırın.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-3">
              <li><a href="#nasil-calisir" className="text-background/70 hover:text-background transition-colors">Nasıl Çalışır</a></li>
              <li><a href="#ozellikler" className="text-background/70 hover:text-background transition-colors">Özellikler</a></li>
              <li><Link to="/giris" className="text-background/70 hover:text-background transition-colors">Giriş Yap</Link></li>
              <li><Link to="/kayit" className="text-background/70 hover:text-background transition-colors">Üye Ol</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Kullanıcılar İçin</h4>
            <ul className="space-y-3">
              <li><Link to="/kayit?rol=sofor" className="text-background/70 hover:text-background transition-colors">Şoför Olarak Başla</Link></li>
              <li><Link to="/kayit?rol=musteri" className="text-background/70 hover:text-background transition-colors">Müşteri Olarak Başla</Link></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Sıkça Sorulan Sorular</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Destek</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">İletişim</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="w-5 h-5" />
                <span>info@yukbul.com</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="w-5 h-5" />
                <span>+90 (212) 555 00 00</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <MapPin className="w-5 h-5" />
                <span>İstanbul, Türkiye</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © 2024 Yükbul. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-background/50 hover:text-background transition-colors">Gizlilik Politikası</a>
            <a href="#" className="text-background/50 hover:text-background transition-colors">Kullanım Şartları</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
