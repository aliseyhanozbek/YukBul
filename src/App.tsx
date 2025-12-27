import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { clearOldStorage } from "@/utils/storageCleanup";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Kayit from "./pages/Kayit";
import Giris from "./pages/Giris";
import SoforPanel from "./pages/sofor/SoforPanel";
import SoforIlanlar from "./pages/sofor/SoforIlanlar";
import IlanOlustur from "./pages/sofor/IlanOlustur";
import SoforMesajlar from "./pages/sofor/SoforMesajlar";
import SoforAktifIslemler from "./pages/sofor/SoforAktifIslemler";
import SoforKonum from "./pages/sofor/SoforKonum";
import SoforIstatistikler from "./pages/sofor/SoforIstatistikler";
import SoforProfil from "./pages/sofor/SoforProfil";
import MusteriPanel from "./pages/musteri/MusteriPanel";
import MusteriIlanlar from "./pages/musteri/MusteriIlanlar";
import MusteriMesajlar from "./pages/musteri/MusteriMesajlar";
import MusteriAktifIslemler from "./pages/musteri/MusteriAktifIslemler";
import MusteriTakip from "./pages/musteri/MusteriTakip";
import MusteriProfil from "./pages/musteri/MusteriProfil";
import SirketPanel from "./pages/sirket/SirketPanel";
import SirketProfil from "./pages/sirket/SirketProfil";
import SirketSuruculer from "./pages/sirket/SirketSuruculer";
import SirketHarita from "./pages/sirket/SirketHarita";
import SirketIstatistikler from "./pages/sirket/SirketIstatistikler";

const queryClient = new QueryClient();

const App = () => {
  // Clear old storage data on app initialization
  useEffect(() => {
    clearOldStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/kayit" element={<Kayit />} />
                <Route path="/giris" element={<Giris />} />

                {/* Şoför Routes */}
                <Route path="/sofor/panel" element={<SoforPanel />} />
                <Route path="/sofor/ilanlar" element={<SoforIlanlar />} />
                <Route path="/sofor/ilan-olustur" element={<IlanOlustur />} />
                <Route path="/sofor/mesajlar" element={<SoforMesajlar />} />
                <Route path="/sofor/aktif-islemler" element={<SoforAktifIslemler />} />
                <Route path="/sofor/konum" element={<SoforKonum />} />
                <Route path="/sofor/istatistikler" element={<SoforIstatistikler />} />
                <Route path="/sofor/profil" element={<SoforProfil />} />

                {/* Müşteri Routes */}
                <Route path="/musteri/panel" element={<MusteriPanel />} />
                <Route path="/musteri/ilanlar" element={<MusteriIlanlar />} />
                <Route path="/musteri/mesajlar" element={<MusteriMesajlar />} />
                <Route path="/musteri/aktif-islemler" element={<MusteriAktifIslemler />} />
                <Route path="/musteri/takip" element={<MusteriTakip />} />
                <Route path="/musteri/profil" element={<MusteriProfil />} />

                {/* Şirket Routes */}
                <Route path="/sirket/panel" element={<SirketPanel />} />
                <Route path="/sirket/profil" element={<SirketProfil />} />
                <Route path="/sirket/suruculer" element={<SirketSuruculer />} />
                <Route path="/sirket/harita" element={<SirketHarita />} />
                <Route path="/sirket/istatistikler" element={<SirketIstatistikler />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
