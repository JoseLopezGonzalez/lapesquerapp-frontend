import { Loader2 } from 'lucide-react'
import React from 'react'

const Loader = ({ text = 'Cargando' }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}

export default Loader
