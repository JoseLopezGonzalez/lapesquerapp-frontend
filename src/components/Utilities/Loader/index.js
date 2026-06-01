import { Loader2 } from 'lucide-react';
import React from 'react';

const Loader = ({ text = 'Cargando' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className="text-primary h-6 w-6 animate-spin" />
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
};

export default Loader;
