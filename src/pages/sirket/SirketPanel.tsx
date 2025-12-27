import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Building2, Users, Wallet, Copy, Check, MapPin,
    Truck, Star, TrendingUp, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import CompanyMap from "@/components/sirket/CompanyMap";
import { Link } from "react-router-dom";

interface CompanyStats {
    totalDrivers: number;
    totalRevenue: string;
    activeShipments: number; // For now mapping to active location shares
}

interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    vehicle: string;
    plate: string;
    rating: number;
    totalShipments: number;
}

const SirketPanel = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<any>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [stats, setStats] = useState<CompanyStats>({
        totalDrivers: 0,
        totalRevenue: "₺0",
        activeShipments: 0
    });

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!user?.id) return;

            try {
                // 1. Get Company Details
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('owner_id', user.id)
                    .single();

                if (companyError) {
                    console.error("Error fetching company:", companyError);
                    setLoading(false);
                    return;
                }

                setCompany(companyData);

                if (companyData) {
                    // 2. Get Linked Drivers
                    const { data: driversData, error: driversError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('company_id', companyData.id)
                        .eq('role', 'sofor');

                    if (!driversError && driversData) {
                        setDrivers(driversData as any);

                        // 3. Get Orders for Revenue Calculation
                        const driverIds = driversData.map(d => d.id);
                        const { data: ordersData } = await supabase
                            .from('orders')
                            .select('final_price, price')
                            .in('driverId', driverIds)
                            .eq('status', 'Tamamlandı');

                        // 4. Get active locations for "Active Shipments" proxy
                        const { data: activeSharingData } = await supabase
                            .from('locationSharing')
                            .select('driverId')
                            .in('driverId', driverIds)
                            .eq('isSharing', true);

                        // Calculate unique active drivers
                        const uniqueActiveDrivers = new Set(activeSharingData?.map(d => d.driverId)).size;

                        // Calculate Revenue
                        let totalRev = 0;
                        ordersData?.forEach(order => {
                            // Helper to parse currency string or number
                            const parseMoney = (val: any) => {
                                if (typeof val === 'number') return val;
                                if (!val) return 0;
                                // Clean string: remove "₺", remove dots, replace comma with dot
                                const clean = val.toString().replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
                                return parseFloat(clean) || 0;
                            };

                            const val = parseMoney(order.final_price) || parseMoney(order.price);
                            totalRev += val;
                        });

                        setStats({
                            totalDrivers: driversData.length,
                            totalRevenue: `₺${totalRev.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                            activeShipments: uniqueActiveDrivers
                        });
                    }
                }

            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [user?.id]);

    const copyCompanyId = () => {
        if (company?.id) {
            navigator.clipboard.writeText(company.id);
            setCopied(true);
            toast.success("Şirket ID kopyalandı!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <DashboardLayout role="sirket">
            <div className="space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                            {loading ? '...' : company?.name || 'Şirket Paneli'}
                        </h1>
                        <p className="text-muted-foreground">Filo yönetimi ve istatistikler</p>
                    </div>

                    {/* Company ID Card */}
                    <Card className="w-full md:w-auto bg-blue-50/50 border-blue-100">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-blue-600 font-medium">Şirket ID</div>
                                <code className="text-sm font-bold text-slate-700">{company?.id || '...'}</code>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyCompanyId}>
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Toplam Sürücü</p>
                                <h3 className="text-2xl font-bold">{stats.totalDrivers}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Toplam Gelir</p>
                                <h3 className="text-2xl font-bold">{stats.totalRevenue}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Aktif Konumlar</p>
                                <h3 className="text-2xl font-bold">{stats.activeShipments}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Drivers List & Map Container */}
                <div className="grid lg:grid-cols-3 gap-6 h-[500px] lg:h-[600px]">
                    {/* Driver List (Condensed) */}
                    <div className="lg:col-span-1 flex flex-col h-full">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="py-4">
                                <CardTitle className="text-lg">Sürücü Listesi</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                {loading ? (
                                    <div className="text-center py-10">Yükleniyor...</div>
                                ) : drivers.length > 0 ? (
                                    <div className="divide-y">
                                        {drivers.map((driver) => (
                                            <div key={driver.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {driver.name.charAt(0)}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-semibold text-sm truncate">{driver.name}</h4>
                                                        <div className="text-xs text-muted-foreground">{driver.plate}</div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-slate-50">
                                                    {driver.vehicle || 'Araç?'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        Sürücü bulunamadı.
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-2 border-t bg-slate-50">
                                <Button variant="ghost" className="w-full text-xs h-8" asChild>
                                    <Link to="/sirket/suruculer">Tümünü Gör</Link>
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Map Section */}
                    <div className="lg:col-span-2 flex flex-col h-full">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="py-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-500" />
                                    Canlı Filo Haritası
                                </CardTitle>
                                <CardDescription>Sadece aktif konum paylaşan araçlar görünür</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 relative bg-slate-100">
                                <CompanyMap drivers={drivers} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default SirketPanel;
