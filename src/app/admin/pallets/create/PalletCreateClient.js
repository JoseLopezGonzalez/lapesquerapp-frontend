'use client'

import PalletView from '@/components/Admin/Pallets/PalletDialog/PalletView'
import React from 'react'

const PalletCreateClient = () => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <PalletView
                palletId={null} // Modo creación
                wrappedInDialog={false} // No está en un diálogo
            />
        </div>
    )
}

export default PalletCreateClient 