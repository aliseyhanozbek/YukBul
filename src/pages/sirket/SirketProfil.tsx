import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Save, Copy, Check, MapPin, Phone, FileText } from "lucide-react";
import { toast } from "sonner";

const SirketProfil = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const [company, setCompany] = useState({
        id: "",
        name: "",
        tax_no: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('owner_id', user.id)
                    .single();

                if (error) {
                    console.error("Error fetching company:", error);
                    return;
                }

                if (data) {
                    setCompany({
                        id: data.id,
                        name: data.name || "",
                        tax_no: data.tax_no || "",
                        phone: data.phone || "",
                        address: data.address || ""
                    });
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [user?.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    phone: company.phone,
                    address: company.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', company.id);

            if (error) throw error;
            toast.success("Şirket bilgileri güncellendi");
        } catch (error: any) {
            toast.error("Hata: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const copyCompanyId = () => {
        if (company.id) {
            navigator.clipboard.writeText(company.id);
            setCopied(true);
            toast.success("ID kopyalandı");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <DashboardLayout role="sirket">
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold">Şirket Profili</h1>
                    <p className="text-muted-foreground">Şirket bilgilerinizi görüntüleyin ve düzenleyin.</p>
                </div>

                <div className="grid gap-6">
                    {/* Identity Card */}
                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-700">
                                <Building2 className="w-5 h-5" />
                                Kimlik Bilgileri
                            </CardTitle>
                            <CardDescription>
                                Bu bilgiler şoförleriniz ve sistem tarafından kullanılır.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <Label>Şirket Adı</Label>
                                    <div className="font-semibold text-lg">{loading ? '...' : company.name}</div>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <Label>Vergi Numarası</Label>
                                    <div className="font-mono text-slate-600">{loading ? '...' : company.tax_no || 'Belirtilmemiş'}</div>
                                </div>
                            </div>

                            <Separator className="bg-blue-100" />

                            <div className="space-y-2">
                                <Label className="text-blue-700 font-bold">Şirket ID (Davet Kodu)</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white p-3 rounded-md border border-blue-200 font-mono text-lg tracking-wide select-all">
                                        {loading ? '...' : company.id}
                                    </div>
                                    <Button onClick={copyCompanyId} variant="outline" className="shrink-0 gap-2">
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        Kopyala
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Bu kodu şoförlerinizle paylaşarak şirketinize katılmalarını sağlayabilirsiniz.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Details Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>İletişim Bilgileri</CardTitle>
                            <CardDescription>
                                İletişim ve adres bilgilerinizi buradan güncelleyebilirsiniz.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        placeholder="05..."
                                        className="pl-9"
                                        value={company.phone}
                                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Adres</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="address"
                                        placeholder="Şirket merkezi adresi..."
                                        className="pl-9"
                                        value={company.address}
                                        onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <>Kaydediliyor...</>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Değişiklikleri Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SirketProfil;
