import { UserPlus, FileText, MessageSquare, CheckCircle2, Truck, MapPin } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Üye Ol",
    description: "Şoför veya müşteri olarak platforma kayıt olun.",
    color: "primary"
  },
  {
    icon: FileText,
    title: "İlan Oluştur / Görüntüle",
    description: "Şoförler güzergah ilanı oluşturur, müşteriler ilanları inceler.",
    color: "secondary"
  },
  {
    icon: MessageSquare,
    title: "Pazarlık Yap",
    description: "Mesajlaşma sistemi üzerinden fiyat ve detayları konuşun.",
    color: "primary"
  },
  {
    icon: CheckCircle2,
    title: "Anlaşma Onayla",
    description: "İki taraf da onay verdiğinde anlaşma aktif hale gelir.",
    color: "secondary"
  },
  {
    icon: MapPin,
    title: "Takip Et",
    description: "Canlı konum paylaşımı ile sevkiyatı takip edin.",
    color: "primary"
  },
  {
    icon: Truck,
    title: "Tamamla & Değerlendir",
    description: "Sevkiyat tamamlandığında karşılıklı değerlendirme yapın.",
    color: "secondary"
  }
];

const HowItWorksSection = () => {
  return (
    <section id="nasil-calisir" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Truck className="w-4 h-4" />
            <span>Kolay Kullanım</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nasıl
            <span className="text-gradient"> Çalışır?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            6 basit adımda yükünüzü bulun veya nakliye hizmeti alın.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary hidden lg:block -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center text-sm font-bold z-10">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`relative w-20 h-20 rounded-2xl mb-4 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    step.color === "primary" 
                      ? "gradient-primary shadow-glow-primary" 
                      : "gradient-secondary shadow-glow-secondary"
                  }`}>
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
