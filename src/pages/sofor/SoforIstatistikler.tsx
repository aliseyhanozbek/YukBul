import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3, TrendingUp, Truck, DollarSign, Route, Calendar,
  ArrowUp, ArrowDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface MonthlyStat {
  month: string;
  value: number;
}

interface ChartDataItem {
  name: string;
  gelir: number;
}

interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
}


const SoforIstatistikler = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalKm, setTotalKm] = useState(0);
  const [completedShipmentsCount, setCompletedShipmentsCount] = useState(0);
  const [totalIncome, setTotalIncome] = useState("₺0");
  const [totalExpense, setTotalExpense] = useState("₺0");
  const [netProfit, setNetProfit] = useState("₺0");
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // New State Variables for Charts
  const [loyalCustomers, setLoyalCustomers] = useState<{ name: string; count: number }[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<{ name: string; count: number }[]>([]);

  // Get all 12 months initialized with 0
  const getAllMonths = () => {
    const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return monthNames.map((monthName, index) => ({
      month: monthName,
      value: 0,
      expense: 0,
      net: 0,
      monthIndex: index // 0 = Oca, 11 = Ara
    }));
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Initialize monthly stats with all 12 months (all starting at 0)
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
        const initialMonthlyStats = monthNames.map((monthName, index) => ({
          month: monthName,
          value: 0,
          expense: 0,
          net: 0,
          monthIndex: index
        }));

        // Fetch completed orders with financial data AND customer details
        // Only get orders with completedAt (not null) to ensure they are truly completed
        const { data: completedOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*, customer:customerId(name)') // Fetch customer name
          .eq('driverId', user.id)
          .eq('status', 'Tamamlandı')
          .not('completedAt', 'is', null);

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        }

        console.log('Fetched completed orders:', completedOrders?.length || 0);

        // Calculate totals from completed orders
        let totalIncomeAmount = 0;
        let totalExpenseAmount = 0;
        let totalNetProfit = 0;
        let totalKmSum = 0;

        // Calculate expense totals for pie chart
        let totalFuelCost = 0;
        let totalRoadCost = 0;
        let totalOtherExpenses = 0;

        // Maps for new charts
        const customerCounts: Record<string, number> = {};
        const routeCounts: Record<string, number> = {};

        if (completedOrders) {
          completedOrders.forEach((order) => {
            // --- Financials ---
            if (order.final_price) {
              const priceNum = Number(order.final_price);
              if (!isNaN(priceNum) && priceNum > 0) {
                totalIncomeAmount += priceNum;
              }
            }

            const fuel = Number(order.fuel_cost) || 0;
            const road = Number(order.road_cost) || 0;
            const other = Number(order.other_expenses) || 0;
            const orderTotalExpense = fuel + road + other;
            totalExpenseAmount += orderTotalExpense;

            totalFuelCost += fuel;
            totalRoadCost += road;
            totalOtherExpenses += other;

            if (order.net_profit) {
              totalNetProfit += Number(order.net_profit) || 0;
            }

            if (order.total_km) {
              totalKmSum += Number(order.total_km) || 0;
            }

            // --- Popular Routes ---
            if (order.from && order.to) {
              // Extract city from "City, District" format if possible, otherwise use full string
              // Simple assumption: "City, District" -> "City"
              const fromCity = order.from.split(',')[0].trim();
              const toCity = order.to.split(',')[0].trim();
              const routeKey = `${fromCity} ➝ ${toCity}`;
              routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
            }

            // --- Loyal Customers ---
            // @ts-ignore - Supabase type inference might miss the joined 'customer' property
            const customerName = order.customer?.name || 'Bilinmeyen Müşteri';
            customerCounts[customerName] = (customerCounts[customerName] || 0) + 1;

            // --- Monthly Stats ---
            if (order.completedAt) {
              try {
                let orderDate: Date;
                if (typeof order.completedAt === 'string') {
                  if (order.completedAt.includes('T')) {
                    orderDate = new Date(order.completedAt);
                  } else {
                    orderDate = new Date(order.completedAt + 'T00:00:00');
                  }
                } else {
                  orderDate = new Date(order.completedAt);
                }

                if (!isNaN(orderDate.getTime())) {
                  const monthIdx = orderDate.getMonth();
                  const monthStat = initialMonthlyStats.find(m => m.monthIndex === monthIdx);

                  if (monthStat) {
                    // Add Income
                    if (order.final_price) {
                      const priceStr = order.final_price.toString().replace(/[₺,\s]/g, '');
                      const priceNum = Number(priceStr);
                      if (!isNaN(priceNum) && priceNum > 0) monthStat.value += priceNum;
                    }
                    // Add Expense
                    monthStat.expense += orderTotalExpense;

                    // Net (Just derived for chart later)
                  }
                }
              } catch (dateError) {
                console.warn('Error parsing completedAt date:', order.completedAt, dateError);
              }
            }
          });
        }

        // --- Process Loyal Customers ---
        const sortedCustomers = Object.entries(customerCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
        setLoyalCustomers(sortedCustomers);

        // --- Process Popular Routes ---
        const sortedRoutes = Object.entries(routeCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
        setPopularRoutes(sortedRoutes);


        // Calculate completed shipments count
        const completedCount = completedOrders?.length || 0;

        // Format currency
        const formatCurrency = (amount: number) => {
          return amount.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
        };

        setTotalKm(totalKmSum);
        setCompletedShipmentsCount(completedCount);
        setTotalIncome(formatCurrency(totalIncomeAmount));
        setTotalExpense(formatCurrency(totalExpenseAmount));
        setNetProfit(formatCurrency(totalNetProfit));

        // Map monthly stats for chart
        const chartDataForGraph = initialMonthlyStats.map(({ month, value, expense }) => ({
          name: month,
          gelir: value,
          gider: expense,
          net: value - expense
        }));

        setMonthlyStats(initialMonthlyStats.map(({ month, value }) => ({ month, value })));
        setChartData(chartDataForGraph);

        // Calculate expense categories for pie chart
        const totalExpensesForChart = totalFuelCost + totalRoadCost + totalOtherExpenses;
        const expenseCategoriesData: ExpenseCategory[] = [];

        if (totalExpensesForChart > 0) {
          expenseCategoriesData.push(
            { name: 'Yakıt Gideri', amount: totalFuelCost, percentage: Math.round((totalFuelCost / totalExpensesForChart) * 100) },
            { name: 'Yol Gideri', amount: totalRoadCost, percentage: Math.round((totalRoadCost / totalExpensesForChart) * 100) },
            { name: 'Diğer Giderler', amount: totalOtherExpenses, percentage: Math.round((totalOtherExpenses / totalExpensesForChart) * 100) }
          );
        }

        setExpenseCategories(expenseCategoriesData);

      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user?.id]);

  return (
    <DashboardLayout role="sofor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">İstatistikler</h1>
          <p className="text-muted-foreground">Performansınızı detaylı olarak inceleyin</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Route className="w-6 h-6 text-primary" />
                </div>
                {!loading && totalKm > 0 && (
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold min-h-[2.5rem] flex items-center">
                {loading ? "..." : totalKm.toLocaleString('tr-TR')}
              </div>
              <div className="text-sm text-muted-foreground">Toplam KM</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-secondary" />
                </div>
                {!loading && completedShipmentsCount > 0 && (
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold min-h-[2.5rem] flex items-center">
                {loading ? "..." : completedShipmentsCount}
              </div>
              <div className="text-sm text-muted-foreground">Tamamlanan Yük</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                {!loading && totalIncome !== "₺0" && (
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold min-h-[2.5rem] flex items-center">
                {loading ? "..." : totalIncome}
              </div>
              <div className="text-sm text-muted-foreground">Toplam Gelir</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                {!loading && totalExpense !== "₺0" && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold min-h-[2.5rem] flex items-center">
                {loading ? "..." : totalExpense}
              </div>
              <div className="text-sm text-muted-foreground">Toplam Gider</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Monthly Financial Overview (Span 2 to capture attention) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Aylık Finansal Durum (Gelir vs Gider)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground">
                  Yükleniyor...
                </div>
              ) : chartData.some(s => s.gelir > 0 || (s as any).gider > 0) ? (
                <div className="h-[320px] w-full">
                  <ChartContainer
                    config={{
                      gelir: { label: "Gelir", color: "hsl(var(--primary))" },
                      gider: { label: "Gider", color: "#ef4444" }, // Red for expense
                    }}
                    className="h-full w-full"
                  >
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltipContent />}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="gelir" name="Gelir" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-center">
                  <div className="text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Finansal verileriniz burada görünecek</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Breakdown Pie (Fits nicely on the side) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Gider Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : expenseCategories.length > 0 ? (
                <>
                  {expenseCategories.map((category, index) => {
                    const colors = ['bg-primary', 'bg-secondary', 'bg-muted-foreground'];
                    return (
                      <div key={index}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">{category.name}</span>
                          <span className="text-sm font-medium">
                            {category.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, style: 'currency', currency: 'TRY' })}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[index % colors.length]} rounded-full`}
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-6 mt-4 border-t">
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                      <span className="font-medium text-green-900">Net Kar</span>
                      <span className="font-bold text-xl text-green-700">{netProfit}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">Henüz gider verisi yok</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Bottom Row Charts */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Loyal Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Sadık Müşteriler (En Çok İşlem)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
              ) : loyalCustomers.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ChartContainer config={{ count: { label: "İşlem Sayısı", color: "hsl(var(--primary))" } }} className="h-full w-full">
                    <BarChart layout="vertical" data={loyalCustomers} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 13, fontWeight: 500 }}
                        width={100}
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30}>
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-center text-muted-foreground">
                  Veri Bulunamadı
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="w-5 h-5 text-purple-600" />
                Popüler Rotalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
              ) : popularRoutes.length > 0 ? (
                <div className="space-y-4">
                  {popularRoutes.slice(0, 5).map((route, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                          {i + 1}
                        </div>
                        <span className="font-medium text-sm">{route.name}</span>
                      </div>
                      <div className="text-sm font-semibold bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">
                        {route.count} Sefer
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-center text-muted-foreground">
                  Veri Bulunamadı
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SoforIstatistikler;
