import { Loader2 } from 'lucide-react'
import React from 'react'

const Loader = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando</p>
        </div>
    )
}

export default Loader