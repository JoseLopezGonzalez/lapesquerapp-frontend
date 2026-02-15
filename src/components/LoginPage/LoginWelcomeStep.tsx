"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RotatingText from "@/components/Utilities/RotatingText";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface LoginWelcomeStepProps {
  brandingImageUrl?: string | null;
  isDemo: boolean;
  tenantActive: boolean;
  onContinue: () => void;
}

export default function LoginWelcomeStep({
  brandingImageUrl,
  isDemo,
  tenantActive,
  onContinue,
}: LoginWelcomeStepProps) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative min-h-screen w-full flex flex-col items-center px-4 pb-8"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={brandingImageUrl || "/images/landing.png"}
          alt="Imagen de branding"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          onError={(e) => {
            e.currentTarget.src = "/images/landing.png";
          }}
        />
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "linear-gradient(to top, white 0%, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "linear-gradient(to top, black 0%, rgba(0, 0, 0, 0.7) 30%, rgba(0, 0, 0, 0.3) 50%, transparent 60%)",
          }}
        />
      </div>

      {isDemo && (
        <div className="absolute top-4 right-4 z-20 bg-lime-100 text-lime-800 text-xs font-semibold px-3 py-1 rounded-lg shadow">
          MODO DEMO
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-end flex-1 w-full max-w-sm pb-8">
        <div className="flex flex-col items-center text-center space-y-8 w-full">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-primary bg-clip-text bg-gradient-to-tr from-primary to-primary/80">
              La PesquerApp
            </h1>
          </div>

          <div className="flex items-center justify-center gap-1 text-nowrap flex-wrap">
            <span className="text-lg text-foreground">Mantén tu producción</span>
            <RotatingText
              texts={["al día.", "segura.", "eficiente.", "organizada."]}
              mainClassName="text-lg text-foreground font-medium"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={6000}
            />
          </div>

          <Button
            onClick={onContinue}
            size="lg"
            className="w-full h-14 text-base font-semibold gap-2"
            disabled={!tenantActive}
          >
            Continuar
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </Button>

          <p className="text-xs text-muted-foreground px-4">
            Al presionar &quot;Continuar&quot; aceptas nuestros{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 text-primary"
            >
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 text-primary"
            >
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
