'use client'

import { Package, MapPin, BarChart3, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";

const LoadingStoreDetails = ({ storeName }) => {
  const loadingSteps = [
    { icon: Package, text: "Cargando contenido del almacén" },
    { icon: MapPin, text: "Obteniendo mapa y posiciones" },
    { icon: BarChart3, text: "Calculando estadísticas" }
  ];

  const [carouselApi, setCarouselApi] = useState(null);
  const hasAdvancedOnce = useRef(false);
  
  const autoplayPlugin = useRef(
    Autoplay({ 
      delay: 2500, 
      stopOnInteraction: false, 
      stopOnMouseEnter: false 
    })
  );

  // Forzar el primer cambio más rápido
  useEffect(() => {
    if (carouselApi && !hasAdvancedOnce.current) {
      const timer = setTimeout(() => {
        carouselApi.scrollNext();
        hasAdvancedOnce.current = true;
      }, 1000); // Primer cambio después de 1 segundo
      return () => clearTimeout(timer);
    }
  }, [carouselApi]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 ">
      <Card className="grow w-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center justify-center gap-2 max-w-lg w-full">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-base font-semibold text-foreground">
                {storeName ? `Cargando ${storeName}` : "Cargando almacén"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Estamos obteniendo toda la información del almacén. Este proceso puede tardar unos momentos...
              </p>
            </div>
          </div>
          
          <div className="w-full ">
            <div className="relative h-24">
              {/* Gradientes de difuminado arriba y abajo */}
              <div className=" absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>
              <div className="  absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
              
              <Carousel
                opts={{
                  align: "center",
                  loop: true,
                }}
                plugins={[autoplayPlugin.current]}
                setApi={setCarouselApi}
                orientation="vertical"
                className="w-full h-full "
              >
                <CarouselContent className="-mt-0 h-24 ">
                  {loadingSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <CarouselItem key={index} className="pt-0">
                        <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-foreground-50/80 border border-foreground-100/50 h-24">
                          <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm text-foreground font-medium">{step.text}</p>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingStoreDetails;

