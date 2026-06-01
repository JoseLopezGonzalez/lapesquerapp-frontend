'use client';

import { Card } from '@/components/ui/card';
import SkeletonStoreCard from './StoreCard/SkeletonStoreCard';
import { Loader2, Database, Package, MapPin } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useEffect, useState } from 'react';

const LoadingStoresHeader = () => {
  const loadingSteps = [
    { icon: Database, text: 'Obteniendo lista de almacenes' },
    { icon: Package, text: 'Cargando palets registrados' },
    { icon: MapPin, text: 'Preparando información de ubicaciones' },
  ];

  const [carouselApi, setCarouselApi] = useState(null);
  const hasAdvancedOnce = useRef(false);

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 2500,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <div className="scrollbar-none flex w-full gap-3 overflow-x-auto rounded-xl py-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonStoreCard key={i} />
        ))}
      </div>
      <Card className="flex w-full grow items-center justify-center p-8">
        <div className="flex w-full max-w-lg flex-col items-center justify-center gap-2">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-foreground text-base font-semibold">Cargando almacenes</h3>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                Estamos obteniendo la información de tus almacenes. Esto puede tomar unos
                segundos...
              </p>
            </div>
          </div>

          <div className="w-full">
            <div className="relative h-24">
              {/* Gradientes de difuminado arriba y abajo */}
              <div className="from-card pointer-events-none absolute top-0 right-0 left-0 z-10 h-10 bg-gradient-to-b to-transparent"></div>
              <div className="from-card pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-10 bg-gradient-to-t to-transparent"></div>

              <Carousel
                opts={{
                  align: 'center',
                  loop: true,
                }}
                plugins={[autoplayPlugin.current]}
                setApi={setCarouselApi}
                orientation="vertical"
                className="h-full w-full"
              >
                <CarouselContent className="-mt-0 h-24">
                  {loadingSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <CarouselItem key={index} className="pt-0">
                        <div className="bg-foreground-50/80 border-foreground-100/50 flex h-24 items-center justify-center gap-3 rounded-lg border p-3">
                          <div className="bg-primary/10 flex-shrink-0 rounded-md p-1.5">
                            <Icon className="text-primary h-4 w-4" />
                          </div>
                          <p className="text-foreground text-sm font-medium">{step.text}</p>
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
