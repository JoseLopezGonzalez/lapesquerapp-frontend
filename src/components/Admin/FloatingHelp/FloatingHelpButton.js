'use client';

import { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Phone,
  Mail,
  ExternalLink,
  Headset,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

export default function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  const helpActions = [
    {
      id: 'contact-support',
      title: 'Contactar con Soporte',
      description: 'Habla con nuestro equipo de soporte',
      icon: MessageSquare,
      action: () => {
        // console.log("Opening support contact...")
        setIsOpen(false);
      },
    },
    {
      id: 'documentation',
      title: 'Documentación y manuales',
      description: 'Accede a nuestra documentación y guías',
      icon: BookOpen,
      action: () => {
        /* window.open("/help/documentation", "_blank") */
        setIsOpen(false);
      },
    },
    {
      id: 'report-issue',
      title: 'Reportar un problema',
      description: 'Informa de un error o incidencia',
      icon: AlertTriangle,
      action: () => {
        // console.log("Opening issue report form...")
        setIsOpen(false);
      },
      variant: 'urgent',
    },
  ];

  const quickContacts = [
    {
      type: 'phone',
      label: 'Soporte Técnico',
      value: '+34 666 666 666',
      icon: Phone,
    },
    {
      type: 'email',
      label: 'Email',
      value: 'soporte@blueapperp.com',
      icon: Mail,
    },
  ];

  const handleQuickContact = (contact) => {
    if (contact.type === 'phone') {
      window.open(`tel:${contact.value}`);
    } else if (contact.type === 'email') {
      window.open(`mailto:${contact.value}`);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Fondo oscuro cuando está abierto */}
      <div
        className={`fixed inset-0 z-40 bg-black/75 transition-opacity duration-200 ease-in-out ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed right-6 bottom-6 z-50">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              className="shadow-primary/50 bg-primary hover:bg-primary/90 h-fit w-fit rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
              aria-label="Get help and support"
            >
              <Headset className="h-10 w-10" />
              Soporte
            </Button>
          </PopoverTrigger>

          <PopoverContent className="z-50 mr-4 mb-2 w-80 p-0" side="top" align="end" sideOffset={8}>
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle className="text-primary h-5 w-5" />
                <h3 className="text-lg font-semibold">¿Como podemos ayudarte?</h3>
              </div>

              <div className="space-y-2">
                {helpActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.id}
                      className={`cursor-pointer border transition-all duration-200 hover:shadow-md ${
                        action.variant === 'urgent'
                          ? 'hover:border-orange-200 dark:hover:border-orange-800'
                          : 'hover:border-primary/20'
                      }`}
                      onClick={action.action}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              action.variant === 'urgent'
                                ? 'bg-orange-100 dark:bg-orange-900/20'
                                : 'bg-primary/10'
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                action.variant === 'urgent'
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-primary'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="mb-1 text-sm font-medium">{action.title}</h4>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              {action.description}
                            </p>
                          </div>
                          <ExternalLink className="text-muted-foreground mt-1 h-3 w-3 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                  Contactos Rápidos
                </h4>
                <div className="space-y-2">
                  {quickContacts.map((contact) => {
                    const Icon = contact.icon;
                    return (
                      <button
                        key={contact.type}
                        onClick={() => handleQuickContact(contact)}
                        className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors"
                      >
                        <Icon className="text-muted-foreground h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium">{contact.label}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {contact.value}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t pt-3">
                <p className="text-muted-foreground text-center text-xs">
                  Soporte disponible 24h los 7 días de la semana.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
