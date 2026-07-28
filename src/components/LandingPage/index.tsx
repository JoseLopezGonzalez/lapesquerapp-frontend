'use client';
// Necesita 'use client': usa useForm (formulario de leads) y handlers de scroll/submit

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Fish,
  Package,
  ShoppingCart,
  FileText,
  Waves,
  Shield,
  Globe,
  Mail,
  Phone,
  Sparkle,
  Ticket,
  ArrowUpRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { appName, demoUrl, infoEmail } from '@/configs/branding';
import { notify } from '@/lib/notifications';
import { landingLeadSchema, type LandingLeadForm } from '@/schemas/landingLeadSchema';
import { submitLandingLead } from '@/services/landing/landingLeadService';

const MODULES_SECTION_ID = 'modulos';

export default function LandingPage() {
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LandingLeadForm>({
    resolver: zodResolver(landingLeadSchema),
    defaultValues: { email: '' },
  });

  const handleScrollToModules = () => {
    document.getElementById(MODULES_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  const onSubmitLead = async (data: LandingLeadForm) => {
    setIsSubmittingLead(true);
    try {
      await submitLandingLead({ email: data.email, company: honeypotRef.current?.value ?? '' });
      notify.success('Solicitud enviada. Nos pondremos en contacto contigo pronto.');
      reset({ email: '' });
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-sky-900">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
              fill="currentColor"
              className="text-sky-600"
            />
            <path
              d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z"
              fill="currentColor"
              className="text-sky-400 opacity-50"
            />
          </svg>
        </div>
        <div className="relative container mx-auto px-4 py-24 sm:py-32 lg:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="rounded-xl bg-sky-500 p-3">
                <Waves className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                {appName}
              </h1>
            </div>
            <p className="mb-8 text-xl text-gray-600 sm:text-2xl dark:text-gray-300">
              Gestión total para industrias pesqueras
              <br />
              <span className="text-muted-foreground text-sm">
                Producción ∷ Compras ∷ Ventas ∷ Etiquetado ∷ Trazabilidad
              </span>
            </p>
            <div className="flex w-full flex-row gap-2 sm:justify-center sm:gap-4">
              <Button
                onClick={() => window.open(demoUrl, '_blank')}
                size="lg"
                className="w-full bg-sky-500 hover:bg-sky-400 sm:w-fit"
              >
                Ver demo
                <ArrowUpRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-fit"
                onClick={handleScrollToModules}
              >
                Ver características
              </Button>
            </div>
            <div className="relative mt-16 w-full">
              <div className="relative w-full overflow-hidden">
                <Image
                  src="/images/landingPage/home-mockup.png"
                  alt="sky App - Dashboard Principal"
                  width={1920}
                  height={1080}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
              <div className="absolute top-8 -right-4 hidden lg:block">
                <Card className="p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                      <Fish className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        En Producción
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2.450,00 kg </p>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="absolute bottom-16 -left-4 hidden lg:block">
                <Card className="p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                      <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Stock</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">15.230,00 kg</p>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="absolute -right-8 bottom-5 hidden lg:block">
                <Card className="p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-900">
                      <ShoppingCart className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Ventas</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">24.580,00€</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            <div className="mt-12 flex w-full flex-col items-center justify-center gap-2 text-sm text-gray-500 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Seguro y confiable</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Acceso desde cualquier lugar</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id={MODULES_SECTION_ID} className="bg-neutral-50 py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl tracking-tight text-gray-900 sm:text-3xl dark:text-white">
              Todo lo que necesita tu industria
            </h2>
            <p className="text-md mt-4 text-gray-600 dark:text-gray-300">
              Una solución completa que integra todos los procesos de tu empresa en una única
              plataforma.
            </p>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                  <Fish className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-xl">Producción y Trazabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Control completo desde la captura hasta el producto final. Trazabilidad total para
                  cumplir normativas.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                  <Package className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-xl">Almacén y Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Gestión inteligente de inventarios con mapa interactivo de almacenes, fechas de
                  caducidad y lotes...
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                  <ShoppingCart className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-xl">Compras y Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Automatiza pedidos, gestiona proveedores y optimiza las ventas con análisis en
                  tiempo real.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                  <Sparkle className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-xl">Extracción de PDF con IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Extrae automáticamente datos de documentos PDF de lonjas y proveedores con
                  inteligencia artificial.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex w-fit rounded-xl bg-sky-100 p-3 dark:bg-sky-900">
                  <Ticket className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-xl">Editor de Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Crea, edita e imprime etiquetas personalizadas para tus productos.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-8 text-center">
            <div>
              <h2 className="text-3xl tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                Integrado con las principales lonjas de Andalucía y Portugal
              </h2>
              <p className="text-md mt-4 text-gray-600 dark:text-gray-300">
                Ideamos la plataforma en base a las necesidades reales de compradores de las
                diferentes zonas.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="flex items-center justify-center">
                <Image
                  src="/images/landingPage/logos/logo-docapesca-bn.png"
                  width={1000}
                  height={1000}
                  className="w-full"
                  alt="Logo Docapesca"
                />
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/images/landingPage/logos/logo-armadores-punta-bn.png"
                  width={900}
                  height={900}
                  className="w-full"
                  alt="Logo Armadores Punta"
                />
              </div>

              <div className="flex items-center justify-center">
                <Image
                  src="/images/landingPage/logos/logo-lonja-isla-bn.png"
                  width={900}
                  height={900}
                  className="w-[200px]"
                  alt="Logo Lonja Isla"
                />
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/images/landingPage/logos/logo-cofra-santo-cristo-bn.png"
                  width={900}
                  height={900}
                  className="w-[150px]"
                  alt="Logo Cofra Santo Cristo"
                />
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="/images/landingPage/logos/logo-cofra-bn.png"
                  width={1000}
                  height={1000}
                  className="w-[120px]"
                  alt="Logo Cofra"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-neutral-50 py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Plataforma empresarial de nivel profesional
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Interfaz intuitiva diseñada para maximizar la productividad de tu equipo con datos en
              tiempo real.
            </p>
          </div>
          <div className="mt-16">
            <div className="relative mx-auto max-w-4xl">
              <Image
                src="/images/landingPage/mockup-label.png"
                alt="sky App Dashboard Principal"
                width={1280}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="mt-24 grid gap-4 sm:gap-8 lg:grid-cols-2">
            <div className="relative h-full">
              <div className="flex h-full flex-col rounded-xl bg-gradient-to-tr from-sky-50 to-sky-200 p-8 dark:from-slate-800 dark:to-slate-700">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Extración de documentos
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Extrae información crucial sobre documentos de las diferentes lonjas para luego
                    generar automaticamente recepciones, albaranes , exportaciones personalizadas a
                    softwares de terceros...
                  </p>
                </div>
                <div className="relative flex-1">
                  <div className="flex h-full items-center justify-center">
                    <Image
                      src="/images/landingPage/mockup-ia-2.png"
                      alt="Gestión de Producción"
                      width={1000}
                      height={2000}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-full">
              <div className="flex h-full flex-col rounded-xl bg-gradient-to-br from-sky-50 to-sky-200 p-8 dark:from-slate-800 dark:to-slate-700">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Control de Inventario
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Gestión inteligente de stock y almacenes. A través de mapas interactivos de
                    almacenes con diferentes formas de registrar palets o cajas, incluyendo lectores
                    de codigos de barras y QR.
                  </p>
                </div>
                <div className="relative flex-1">
                  <div className="flex h-full w-full items-center justify-center">
                    <Image
                      src="/images/landingPage/mockup-store.png"
                      alt="Control de Inventario"
                      width={800}
                      height={600}
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-8">
            <div className="rounded-xl bg-gradient-to-r from-sky-200 to-sky-50 p-8 dark:from-slate-800 dark:to-slate-700">
              <div className="mb-8 flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestor de Pedidos Avanzado
                </h3>
                <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-300">
                  Visualiza y gestiona todos tus pedidos de forma centralizada. Analiza el
                  rendimiento de ventas y optimiza la logística. Automatiza el envio de
                  documentación a tus clientes y proveedores.
                </p>
              </div>
              <div className="relative mx-auto max-w-5xl">
                <Image
                  src="/images/landingPage/mockup-orders.png"
                  alt="Dashboard de Análisis"
                  width={1400}
                  height={600}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="flex w-full flex-col items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900">
            <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Cumplimiento Legal</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Normativas internacionales
          </p>
        </div>
      </div>
      <section className="bg-sky-500 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl tracking-tight text-white sm:text-4xl">
              ¿Listo para transformar tu empresa?
            </h2>
            <p className="text-md mt-4 text-sky-100">
              Solicita acceso anticipado y sé de los primeros en experimentar el futuro de la
              gestión pesquerapp.
            </p>
            <form
              onSubmit={handleSubmit(onSubmitLead)}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              noValidate
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="text-left">
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/70"
                    disabled={isSubmittingLead}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 w-fit rounded bg-white/95 px-2 py-0.5 text-xs font-medium text-red-600">
                      * {errors.email.message}
                    </p>
                  )}
                </div>
                {/* Honeypot anti-spam: invisible para usuarios reales, leído aparte del schema RHF */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute h-0 w-0 opacity-0"
                />
                <Button type="submit" variant="secondary" disabled={isSubmittingLead}>
                  {isSubmittingLead ? 'Enviando...' : 'Solicitar acceso'}
                </Button>
              </div>
            </form>
            <p className="mt-10 text-sm text-sky-200">Sin compromiso. Cancela cuando quieras.</p>
          </div>
        </div>
      </section>
      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex w-full flex-col items-center sm:col-span-2 sm:items-start">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-sky-500 p-2">
                  <Waves className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">{appName}</span>
              </div>
              <p className="mt-4 text-center text-gray-400 sm:text-left">
                La solución ERP más completa para la industria pesquera.
                <br /> Gestiona tu empresa con tecnología de vanguardia.
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <h3 className="text-sm font-semibold text-white">Contacto</h3>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span>{infoEmail}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>+34 900 123 456</span>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-slate-800" />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {appName}. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="/legal/terms" className="text-sm text-gray-400 hover:text-white">
                Aviso Legal
              </Link>
              <Link href="/legal/privacy" className="text-sm text-gray-400 hover:text-white">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
