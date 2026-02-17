'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, LogOut, CircleCheck } from 'lucide-react';

/**
 * Pantalla de éxito tras crear una salida de cebo (rol operario).
 * Ofrece: Nueva salida de cebo, Volver al inicio.
 */
export default function CeboSuccessActions({ dispatch, onExit, onNew }) {
  const router = useRouter();

  const handleNewDispatch = () => {
    if (onNew) {
      onNew();
    } else {
      router.push('/admin/cebo-dispatches/create');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center flex-1 min-h-0 py-6 px-4 gap-8">
      <motion.div
        className="flex flex-col items-center gap-4 w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <motion.div
            className="rounded-full bg-green-500/10 p-4 ring-4 ring-green-500/20"
            animate={{
              scale: [1, 1.03, 1],
              opacity: 1,
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2,
              },
            }}
          >
            <CircleCheck className="h-16 w-16 text-green-600" strokeWidth={2} />
          </motion.div>
        </motion.div>
        <motion.p
          className="text-center text-xl font-semibold text-green-700 dark:text-green-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Salida de cebo registrada correctamente
        </motion.p>
      </motion.div>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
      >
        <Card className="w-full">
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex flex-row flex-wrap justify-center gap-4">
              <Button
                variant="default"
                size="lg"
                className="flex-1 min-w-[160px] max-w-[260px] gap-3 min-h-[64px] py-4 text-xl touch-manipulation active:scale-[0.98] transition-transform"
                onClick={handleNewDispatch}
              >
                <PlusCircle className="h-6 w-6 shrink-0" />
                Nueva salida de cebo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 min-w-[160px] max-w-[260px] gap-3 min-h-[64px] py-4 text-xl touch-manipulation active:scale-[0.98] transition-transform"
                onClick={onExit}
              >
                <LogOut className="h-6 w-6 shrink-0" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
