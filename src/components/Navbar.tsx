import { Truck, Package, MapPin, Star, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Yükbul</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#nasil-calisir" className="text-muted-foreground hover:text-foreground transition-colors">
              Nasıl Çalışır
            </a>
            <a href="#ozellikler" className="text-muted-foreground hover:text-foreground transition-colors">
              Özellikler
            </a>
            <a href="#iletisim" className="text-muted-foreground hover:text-foreground transition-colors">
              İletişim
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="hero" asChild>
              <Link to="/giris">Giriş Yap</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/kayit">Üye Ol</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-4">
              <a href="#nasil-calisir" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                Nasıl Çalışır
              </a>
              <a href="#ozellikler" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                Özellikler
              </a>
              <a href="#iletisim" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
                İletişim
              </a>
              <div className="flex flex-col gap-4 pt-4 border-t border-border">
                <Button variant="hero" asChild className="w-full">
                  <Link to="/giris">Giriş Yap</Link>
                </Button>
                <Button variant="hero" asChild className="w-full">
                  <Link to="/kayit">Üye Ol</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
