import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, MapPin, Navigation } from "lucide-react";
import CompanyMap from "@/components/sirket/CompanyMap";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";

interface Driver {
    id: string;
    name: string;
    plate: string;
    isSharing?: boolean;
}

const SirketHarita = () => {
    const { user } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [activeDriverIds, setActiveDriverIds] = useState<Set<string>>(new Set());
    const [focusedDriverId, setFocusedDriverId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;

            // 1. Get Company ID
            const { data: company } = await supabase
                .from('companies')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (company) {
                // 2. Get Drivers
                const { data: driversData } = await supabase
                    .from('users')
                    .select('id, name, plate')
                    .eq('company_id', company.id)
                    .eq('role', 'sofor');

                if (driversData) {
                    setDrivers(driversData as any); // Type assertion for simple props

                    // 3. Check who is actively sharing
                    const { data: sharingData } = await supabase
                        .from('locationSharing')
                        .select('driverId')
                        .in('driverId', driversData.map(d => d.id))
                        .eq('isSharing', true);

                    if (sharingData) {
                        setActiveDriverIds(new Set(sharingData.map(d => d.driverId)));
                    }
                }
            }
        };

        fetchData();

        // Optional: Set up an interval to refresh active status
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const activeDrivers = drivers.filter(d => activeDriverIds.has(d.id));

    return (
        <DashboardLayout role="sirket">
            <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">

                {/* Sidebar List */}
                <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 transition-all">
                    <Card className="h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-muted/30">
                            <h2 className="font-semibold flex items-center gap-2">
                                <List className="w-4 h-4" />
                                Aktif Araçlar ({activeDrivers.length})
                            </h2>
                        </div>
                        <CardContent className="flex-1 p-0 overflow-y-auto">
                            {activeDrivers.length > 0 ? (
                                <div className="divide-y">
                                    {activeDrivers.map(driver => (
                                        <button
                                            key={driver.id}
                                            onClick={() => setFocusedDriverId(driver.id)}
                                            className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group ${focusedDriverId === driver.id ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div>
                                                <div className="font-medium group-hover:text-primary transition-colors">{driver.name}</div>
                                                <div className="text-xs text-muted-foreground">{driver.plate}</div>
                                            </div>
                                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                                Canlı
                                            </Badge>
                                        </button>
                                    ))}

                                    {/* Show inactive drivers roughly? Optional */}
                                    <div className="p-4 text-xs font-semibold text-muted-foreground bg-muted/10 border-t border-b">
                                        Çevrimdışı Sürücüler
                                    </div>
                                    {drivers.filter(d => !activeDriverIds.has(d.id)).map(driver => (
                                        <div key={driver.id} className="p-4 opacity-70 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{driver.name}</div>
                                                <div className="text-xs text-muted-foreground">{driver.plate}</div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">Kapalı</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                                    <Navigation className="w-10 h-10 mb-2 opacity-20" />
                                    <p>Aktif konum paylaşan sürücü yok.</p>
                                    <p className="text-xs mt-2 opacity-70">
                                        Sürücüler "Konum Paylaş" özelliğini açtığında burada görünecekler.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Map Area */}
                <div className="flex-1 bg-slate-100 rounded-xl border border-border relative overflow-hidden shadow-inner">
                    <CompanyMap
                        drivers={drivers}
                        focusedDriverId={focusedDriverId}
                        className="h-full w-full"
                    />
                </div>

            </div>
        </DashboardLayout>
    );
};

export default SirketHarita;
