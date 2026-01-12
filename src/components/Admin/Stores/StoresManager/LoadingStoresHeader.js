'use client'

import { Card } from "@/components/ui/card";
import { ScrollShadow } from "@nextui-org/react";
import SkeletonStoreCard from "./StoreCard/SkeletonStoreCard";
import { Loader2, Database, Package, MapPin } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const LoadingStoresHeader = () => {
  const loadingSteps = [
    { icon: Database, text: "Obteniendo lista de almacenes" },
    { icon: Package, text: "Cargando palets registrados" },
    { icon: MapPin, text: "Preparando información de ubicaciones" }
  ];

  const autoplayPlugin = useRef(
    Autoplay({ delay: 1000, stopOnInteraction: false, stopOnMouseEnter: false })
  );

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6">
      <ScrollShadow 
        orientation="horizontal" 
        className="space-x-3 rounded-xl flex overflow-x-auto w-full scrollbar-none py-2"
      >
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonStoreCard key={i} />
        ))}
      </ScrollShadow>
      <Card className='grow w-full flex items-center justify-center p-8'>
        <div className="flex flex-col items-center justify-center gap-8 max-w-lg w-full">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-base font-semibold text-foreground">
                Cargando almacenes
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Estamos obteniendo la información de tus almacenes. Esto puede tomar unos segundos...
              </p>
            </div>
          </div>
          
          <div className="w-full pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Procesando información
            </p>
            <div className="relative h-24 rounded-lg">
              {/* Gradientes de difuminado arriba y abajo */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background via-background/90 to-transparent z-10 pointer-events-none rounded-t-lg"></div>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background via-background/90 to-transparent z-10 pointer-events-none rounded-b-lg"></div>
              
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[autoplayPlugin.current]}
                orientation="vertical"
                className="w-full h-full"
              >
                <CarouselContent className="-mt-0 h-24">
                  {loadingSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <CarouselItem key={index} className="pt-0">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-foreground-50/80 border border-foreground-100/50 h-24">
                          <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm text-foreground font-medium flex-1">{step.text}</p>
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

export default LoadingStoresHeader;

