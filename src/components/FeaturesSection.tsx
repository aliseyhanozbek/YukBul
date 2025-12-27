import { Truck, Users, MessageSquare, MapPin, BarChart3, Star, Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Truck,
    title: "Güzergah İlanları",
    description: "Şoförler nereden nereye gideceklerini, tarih ve kapasite bilgilerini paylaşarak ilan oluşturur.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Müşteri Eşleştirme",
    description: "Bireysel veya ticari müşteriler, uygun güzergahlardaki ilanları görüntüler ve iletişime geçer.",
    color: "secondary"
  },
  {
    icon: MessageSquare,
    title: "Anlık Mesajlaşma",
    description: "Instagram DM benzeri mesajlaşma sistemi ile fiyat pazarlığı ve anlaşma detayları konuşulur.",
    color: "primary"
  },
  {
    icon: MapPin,
    title: "Canlı Konum Takibi",
    description: "Şoför konumunu paylaşır, müşteri sevkiyatın nerede olduğunu anlık olarak takip eder.",
    color: "secondary"
  },
  {
    icon: BarChart3,
    title: "Şoför Portföyü",
    description: "Toplam km, gelir, gider ve net kar gibi metriklerle şoförler için profesyonel dashboard.",
    color: "primary"
  },
  {
    icon: Star,
    title: "Değerlendirme Sistemi",
    description: "Sevkiyat sonrası karşılıklı puanlama ile güvenilir bir topluluk oluşturulur.",
    color: "secondary"
  },
  {
    icon: Shield,
    title: "Güvenli Anlaşma",
    description: "İki taraflı onay mekanizması ile anlaşmalar güvence altına alınır.",
    color: "primary"
  },
  {
    icon: Clock,
    title: "Aktif İşlem Takibi",
    description: "Onaylanan anlaşmalar aktif işlemler sekmesinde detaylı olarak izlenir.",
    color: "secondary"
  }
];

const FeaturesSection = () => {
  return (
    <section id="ozellikler" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            <span>Platform Özellikleri</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Her İhtiyaca
            <span className="text-gradient"> Çözüm</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Yükbul, nakliyeciler ve müşteriler için kapsamlı özellikler sunar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              hover 
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                  feature.color === "primary" 
                    ? "bg-primary/10 group-hover:bg-primary/20" 
                    : "bg-secondary/10 group-hover:bg-secondary/20"
                }`}>
                  <feature.icon className={`w-7 h-7 ${
                    feature.color === "primary" ? "text-primary" : "text-secondary"
                  }`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
