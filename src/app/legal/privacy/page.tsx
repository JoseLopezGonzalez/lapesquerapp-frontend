import Link from 'next/link';
import { Waves } from 'lucide-react';
import { appName, infoEmail } from '@/configs/branding';

export const metadata = {
  title: 'Política de Privacidad',
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>

        <div className="text-foreground mt-10 flex flex-col gap-8 text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold">Responsable del tratamiento</h2>
            <p className="text-muted-foreground mt-2">
              {appName} es un producto de Congelados Brisamar. Puedes contactar con nosotros para
              cualquier cuestión relacionada con tus datos personales escribiendo a{' '}
              <a href={`mailto:${infoEmail}`} className="text-foreground underline">
                {infoEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Qué datos recogemos</h2>
            <p className="text-muted-foreground mt-2">
              Cuando solicitas acceso a través del formulario de esta web, únicamente recogemos la
              dirección de email que nos facilitas voluntariamente. No utilizamos cookies de
              analítica ni de seguimiento en este sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Para qué usamos tus datos</h2>
            <p className="text-muted-foreground mt-2">
              Usamos tu email exclusivamente para responder a tu solicitud de acceso y ponernos en
              contacto contigo sobre {appName}. No lo usamos con ningún otro fin ni lo cedemos a
              terceros para fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Con quién compartimos tus datos</h2>
            <p className="text-muted-foreground mt-2">
              Tu solicitud se envía a través de un proveedor de envío de emails transaccionales
              (Resend), que actúa como encargado del tratamiento únicamente para hacer llegar el
              mensaje. No compartimos tu email con terceros para publicidad ni lo vendemos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Tus derechos</h2>
            <p className="text-muted-foreground mt-2">
              Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a{' '}
              <a href={`mailto:${infoEmail}`} className="text-foreground underline">
                {infoEmail}
              </a>
              .
            </p>
          </section>

          <section className="border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Este documento es una versión inicial y honesta de nuestra política de privacidad,
              pendiente de revisión legal formal. Si tienes cualquier duda mientras tanto,
              contáctanos directamente.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
