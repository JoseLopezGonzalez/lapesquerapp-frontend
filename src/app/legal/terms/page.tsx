import Link from 'next/link';
import { Waves } from 'lucide-react';
import { appName, infoEmail } from '@/configs/branding';

export const metadata = {
  title: 'Aviso Legal',
};

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border border-b">
        <div className="container mx-auto flex items-center gap-2 px-4 py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-2">
              <Waves className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-foreground text-lg font-bold">{appName}</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">Aviso Legal</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>

        <div className="text-foreground mt-10 flex flex-col gap-8 text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold">Titularidad del sitio</h2>
            <p className="text-muted-foreground mt-2">
              Este sitio web es operado por Congelados Brisamar como titular de {appName}. Para
              cualquier consulta, puedes escribir a{' '}
              <a href={`mailto:${infoEmail}`} className="text-foreground underline">
                {infoEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Objeto</h2>
            <p className="text-muted-foreground mt-2">
              Esta web presenta {appName}, un ERP para empresas del sector pesquero y de
              congelados, y permite solicitar acceso a una demostración del producto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Propiedad intelectual</h2>
            <p className="text-muted-foreground mt-2">
              Los contenidos de este sitio (textos, marca, logotipo, diseño) son propiedad de
              Congelados Brisamar. No está permitida su reproducción sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Uso del formulario de contacto</h2>
            <p className="text-muted-foreground mt-2">
              Al enviar el formulario de solicitud de acceso, aceptas que usemos el email
              proporcionado para responder a tu solicitud, según se describe en nuestra{' '}
              <Link href="/legal/privacy" className="text-foreground underline">
                Política de Privacidad
              </Link>
              .
            </p>
          </section>

          <section className="border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Este documento es una versión inicial y honesta de nuestro aviso legal, pendiente de
              revisión legal formal. Si tienes cualquier duda mientras tanto, contáctanos
              directamente.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
