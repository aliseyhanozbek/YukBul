import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Truck, Package, MessageSquare, MapPin, User, LogOut, Menu, X,
  FileText, Clock, BarChart3, Plus, Home, Building2, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";
import { ModeToggle } from "@/components/mode-toggle";

interface DashboardLayoutProps {
  role: "sofor" | "musteri" | "sirket";
  children?: React.ReactNode;
}

const DashboardLayout = ({ role, children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [totalUnread, setTotalUnread] = useState(0);

  // Get display name with fallback
  const displayName = profile?.name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Yükleniyor...';

  // Get email with fallback
  const displayEmail = user?.email || 'Yükleniyor...';

  // Get role from profile if available, otherwise use prop
  const userRole = profile?.role || role;

  // Fetch total unread messages
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        return;
      }

      try {
        const unreadColumn = userRole === 'sofor' ? 'driver_unread_count' : 'customer_unread_count';
        const { data, error } = await supabase
          .from('conversations')
          .select(unreadColumn)
          .or(userRole === 'sofor'
            ? `driverId.eq.${user.id}`
            : `customerId.eq.${user.id}`
          );

        if (!error && data) {
          const total = data.reduce((sum, conv) => {
            const count = userRole === 'sofor'
              ? (conv.driver_unread_count || 0)
              : (conv.customer_unread_count || 0);
            return sum + count;
          }, 0);
          setTotalUnread(total);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, userRole]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/giris');
  };

  const driverMenuItems = [
    { icon: Home, label: "Ana Sayfa", path: "/sofor/panel" },
    { icon: FileText, label: "İlanlarım", path: "/sofor/ilanlar" },
    { icon: Plus, label: "İlan Oluştur", path: "/sofor/ilan-olustur" },
    { icon: MessageSquare, label: "Mesajlar", path: "/sofor/mesajlar" },
    { icon: Clock, label: "İşlemler", path: "/sofor/aktif-islemler" },
    { icon: MapPin, label: "Konum Paylaş", path: "/sofor/konum" },
    { icon: BarChart3, label: "İstatistikler", path: "/sofor/istatistikler" },
    { icon: User, label: "Profil", path: "/sofor/profil" },
  ];

  const customerMenuItems = [
    { icon: Home, label: "Ana Sayfa", path: "/musteri/panel" },
    { icon: Package, label: "İlanları Görüntüle", path: "/musteri/ilanlar" },
    { icon: MessageSquare, label: "Mesajlar", path: "/musteri/mesajlar" },
    { icon: Clock, label: "İşlemler", path: "/musteri/aktif-islemler" },
    { icon: MapPin, label: "Sevkiyat Takibi", path: "/musteri/takip" },
    { icon: User, label: "Profil", path: "/musteri/profil" },
  ];

  const companyMenuItems = [
    { icon: Home, label: "Ana Sayfa", path: "/sirket/panel" },
    { icon: Users, label: "Sürücüler", path: "/sirket/suruculer" },
    { icon: MapPin, label: "Canlı Harita", path: "/sirket/harita" },
    { icon: BarChart3, label: "İstatistikler", path: "/sirket/istatistikler" },
    { icon: User, label: "Profil", path: "/sirket/profil" },
  ];

  const menuItems = userRole === "sofor"
    ? driverMenuItems
    : userRole === "musteri"
      ? customerMenuItems
      : companyMenuItems;

  const accentColor = userRole === "sofor" ? "primary" : userRole === "musteri" ? "secondary" : "blue-500";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:transform-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl ${userRole === "sofor" ? "gradient-primary" : "gradient-secondary"} flex items-center justify-center`}>
                <Truck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold">Yükbul</span>
                <span className={`block text-xs ${userRole === "sofor" ? "text-primary" : userRole === "musteri" ? "text-secondary" : "text-blue-500"}`}>
                  {userRole === "sofor" ? "Şoför Paneli" : userRole === "musteri" ? "Müşteri Paneli" : "Şirket Paneli"}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isMessages = item.path.includes('/mesajlar');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                    isActive
                      ? userRole === "sofor"
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : userRole === "musteri"
                          ? "bg-secondary/10 text-secondary font-semibold shadow-sm"
                          : "bg-blue-500/10 text-blue-600 font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  <span className="font-medium">{item.label}</span>
                  {isMessages && totalUnread > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border mt-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${userRole === "sofor" ? "bg-primary/10" : "bg-secondary/10"} flex items-center justify-center`}>
                  <User className={`w-5 h-5 ${userRole === "sofor" ? "text-primary" : "text-secondary"}`} />
                </div>
                <div className="flex-1 min-w-0 max-w-[100px]">
                  <div className="font-medium text-sm truncate">
                    {profileLoading ? 'Yükleniyor...' : displayName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {profileLoading ? 'Yükleniyor...' : displayEmail}
                  </div>
                </div>
              </div>
              <ModeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border p-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${userRole === "sofor" ? "gradient-primary" : "gradient-secondary"} flex items-center justify-center`}>
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Yükbul</span>
          </Link>
          <div className="w-6" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
