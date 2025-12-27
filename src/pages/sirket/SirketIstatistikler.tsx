import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart3, TrendingUp, Truck, DollarSign, Route,
    ArrowUp, ArrowDown, Calendar, Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface Driver {
    id: string;
    name: string;
}

interface ExpenseCategory {
    name: string;
    amount: number;
    percentage: number;
}

const SirketIstatistikler = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>("all");

    // Metrics
    const [totalKm, setTotalKm] = useState(0);
    const [completedShipments, setCompletedShipments] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState("₺0");
    const [totalExpense, setTotalExpense] = useState("₺0");
    const [netProfit, setNetProfit] = useState("₺0");
    const [uniqueCities, setUniqueCities] = useState(0);

    // Charts Data
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [loyalCustomers, setLoyalCustomers] = useState<{ name: string; count: number }[]>([]);
    const [popularRoutes, setPopularRoutes] = useState<{ name: string; count: number }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            setLoading(true);

            try {
                // 1. Get Company & Drivers
                const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).single();
                if (!company) { setLoading(false); return; }

                const { data: driversData } = await supabase.from('users').select('id, name').eq('company_id', company.id).eq('role', 'sofor');
                setDrivers(driversData || []);

                const driverIds = driversData?.map(d => d.id) || [];

                // 2. Fetch Orders (All Completed for these drivers)
                let query = supabase
                    .from('orders')
                    .select('*, customer:customerId(name)')
                    .in('driverId', driverIds)
                    .eq('status', 'Tamamlandı')
                    .not('completedAt', 'is', null);

                // Apply Filter if specific driver selected
                if (selectedDriverId !== 'all') {
                    query = query.eq('driverId', selectedDriverId);
                }

                const { data: orders } = await query;

                // 3. Calculate Stats
                let inc = 0, exp = 0, km = 0, profit = 0;
                let fuel = 0, road = 0, other = 0;
                const cities = new Set<string>();
                const customers: Record<string, number> = {};
                const routes: Record<string, number> = {};

                // Initialize Months
                const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"].map((m, i) => ({
                    name: m, index: i, gelir: 0, gider: 0
                }));

                orders?.forEach(order => {
                    // Financials
                    // Remove dots for thousand separators, replace comma with dot
                    const parseMoney = (val: any) => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        const clean = val.toString().replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
                        return parseFloat(clean) || 0;
                    };

                    const orderInc = parseMoney(order.final_price) || parseMoney(order.price);
                    const orderFuel = Number(order.fuel_cost) || 0;
                    const orderRoad = Number(order.road_cost) || 0;
                    const orderOther = Number(order.other_expenses) || 0;
                    const orderExp = orderFuel + orderRoad + orderOther;

                    inc += orderInc;
                    exp += orderExp;
                    km += Number(order.total_km) || 0;
                    profit += (Number(order.net_profit) || (orderInc - orderExp));

                    fuel += orderFuel; road += orderRoad; other += orderOther;

                    // Cities
                    if (order.from) cities.add(order.from.split(',')[0].trim());
                    if (order.to) cities.add(order.to.split(',')[0].trim());

                    // Routes
                    if (order.from && order.to) {
                        const route = `${order.from.split(',')[0].trim()} ➝ ${order.to.split(',')[0].trim()}`;
                        routes[route] = (routes[route] || 0) + 1;
                    }

                    // Customers
                    // @ts-ignore
                    const custName = order.customer?.name || 'Bilinmeyen Müşteri';
                    customers[custName] = (customers[custName] || 0) + 1;

                    // Monthly Chart
                    if (order.completedAt) {
                        const d = new Date(order.completedAt);
                        if (!isNaN(d.getTime())) {
                            const mIndex = d.getMonth();
                            months[mIndex].gelir += orderInc;
                            months[mIndex].gider += orderExp;
                        }
                    }
                });

                // Set State
                const fmt = (v: number) => v.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 });

                setTotalRevenue(fmt(inc));
                setTotalExpense(fmt(exp));
                setNetProfit(fmt(profit));
                setTotalKm(km);
                setCompletedShipments(orders?.length || 0);
                setUniqueCities(cities.size);
                setMonthlyStats(months);

                // Pie Data
                const totalExpCalc = fuel + road + other;
                if (totalExpCalc > 0) {
                    setExpenseCategories([
                        { name: 'Yakıt', amount: fuel, percentage: Math.round(fuel / totalExpCalc * 100) },
                        { name: 'Yol', amount: road, percentage: Math.round(road / totalExpCalc * 100) },
                        { name: 'Diğer', amount: other, percentage: Math.round(other / totalExpCalc * 100) },
                    ]);
                } else {
                    setExpenseCategories([]);
                }

                // Top Lists
                setLoyalCustomers(Object.entries(customers).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5));
                setPopularRoutes(Object.entries(routes).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5));

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id, selectedDriverId]);

    return (
        <DashboardLayout role="sirket">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">İstatistikler</h1>
                        <p className="text-muted-foreground">Filonuzun performans raporları</p>
                    </div>

                    {/* Driver Filter */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <Filter className="w-4 h-4 text-muted-foreground ml-2" />
                        <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                            <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0">
                                <SelectValue placeholder="Sürücü Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Filo</SelectItem>
                                {drivers.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* --- Top Metrics --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                            </div>
                            <div className="text-2xl font-bold">{totalRevenue}</div>
                            <div className="text-xs text-muted-foreground">Toplam Gelir</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                            </div>
                            <div className="text-2xl font-bold">{totalExpense}</div>
                            <div className="text-xs text-muted-foreground">Toplam Gider</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Route className="w-5 h-5" /></div>
                            </div>
                            <div className="text-2xl font-bold">{uniqueCities}</div>
                            <div className="text-xs text-muted-foreground">Farklı Şehir</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Truck className="w-5 h-5" /></div>
                            </div>
                            <div className="text-2xl font-bold">{completedShipments}</div>
                            <div className="text-xs text-muted-foreground">Tamamlanan Sefer</div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Charts --- */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Aylık Finansal Durum</CardTitle>
                            <CardDescription>Gelir ve Gider Karşılaştırması</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ChartContainer config={{ gelir: { label: "Gelir", color: "hsl(var(--primary))" }, gider: { label: "Gider", color: "#ef4444" } }} className="h-full w-full">
                                    <BarChart data={monthlyStats}>
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={v => `₺${v / 1000}k`} fontSize={12} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="gelir" fill="var(--color-gelir)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="gider" fill="var(--color-gider)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Gider Dağılımı</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {expenseCategories.map((cat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>{cat.name}</span>
                                        <span className="font-medium">{cat.amount.toLocaleString()} ₺</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-orange-500' : 'bg-gray-500'}`} style={{ width: `${cat.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t flex justify-between items-center">
                                <span className="font-semibold">Net Kar</span>
                                <span className="text-xl font-bold text-green-600">{netProfit}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Lists --- */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle>Popüler Rotalar</CardTitle></CardHeader>
                        <CardContent>
                            {popularRoutes.length > 0 ? (
                                <div className="space-y-4">
                                    {popularRoutes.map((r, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                                                <span className="font-medium">{r.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-muted-foreground">{r.count} Sefer</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-center text-muted-foreground py-10">Veri yok</div>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Sadık Müşteriler</CardTitle></CardHeader>
                        <CardContent>
                            {loyalCustomers.length > 0 ? (
                                <div className="space-y-4">
                                    {loyalCustomers.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                            <span className="font-medium">{c.name}</span>
                                            <span className="text-sm font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded">{c.count} İşlem</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-center text-muted-foreground py-10">Veri yok</div>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SirketIstatistikler;
