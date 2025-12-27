import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Phone, Truck, Star, MoreHorizontal, UserX } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    vehicle: string;
    plate: string;
    rating: number; // Placeholder, assuming we might join this later
    role: 'sofor';
}

const SirketSuruculer = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDrivers, setActiveDrivers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchDrivers = async () => {
            if (!user?.id) return;

            try {
                // 1. Get Company ID first
                const { data: company } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (company) {
                    // 2. Fetch Drivers linked to company
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('company_id', company.id)
                        .eq('role', 'sofor');

                    if (error) throw error;

                    setDrivers(data as unknown as Driver[]);
                    setFilteredDrivers(data as unknown as Driver[]);

                    // 3. Fetch Active Status (Location Sharing)
                    const driverIds = data.map(d => d.id);
                    const { data: activeData } = await supabase
                        .from('locationSharing')
                        .select('driverId')
                        .in('driverId', driverIds)
                        .eq('isSharing', true);

                    const activeSet = new Set(activeData?.map(d => d.driverId));
                    setActiveDrivers(activeSet);
                }
            } catch (error) {
                console.error("Error fetching drivers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrivers();
    }, [user?.id]);

    useEffect(() => {
        const results = drivers.filter(driver =>
            driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (driver.plate && driver.plate.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredDrivers(results);
    }, [searchTerm, drivers]);

    const handleRemoveDriver = async (driverId: string, driverName: string) => {
        if (!confirm(`${driverName} isimli sürücüyü şirketten çıkarmak istediğinize emin misiniz?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ company_id: null })
                .eq('id', driverId);

            if (error) throw error;

            toast.success(`${driverName} şirketten çıkarıldı.`);
            // Update local state
            const updatedList = drivers.filter(d => d.id !== driverId);
            setDrivers(updatedList);
        } catch (error: any) {
            toast.error("Hata: " + error.message);
        }
    };

    return (
        <DashboardLayout role="sirket">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Sürücüler</h1>
                        <p className="text-muted-foreground">Şirketinize bağlı şoförlerin listesi ve yönetimi</p>
                    </div>
                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="İsim veya plaka ara..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-10">Yükleniyor...</div>
                    ) : filteredDrivers.length > 0 ? (
                        filteredDrivers.map((driver) => {
                            const isWorking = activeDrivers.has(driver.id);
                            return (
                                <Card key={driver.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="p-6 flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                                                    {driver.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{driver.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>{driver.plate || 'Plaka Yok'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleRemoveDriver(driver.id, driver.name)}>
                                                        <UserX className="w-4 h-4 mr-2" />
                                                        Şirketten Çıkar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="px-6 pb-6 space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Truck className="w-4 h-4 text-muted-foreground" />
                                                <span>{driver.vehicle || 'Araç bilgisi yok'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                                <span>{driver.phone || 'Telefon yok'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                {isWorking ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                                                        Çalışıyor
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 border-none">
                                                        Çalışmıyor
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Truck className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Sürücü Bulunamadı</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Arama kriterlerinize uygun sürücü yok veya henüz kimse şirketinize katılmamış.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SirketSuruculer;
