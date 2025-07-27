'use client'

import PalletView from '@/components/Admin/Pallets/PalletDialog/PalletView'
import React from 'react'

const PalletClient = ({ palletId }) => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <PalletView
                palletId={palletId}
            />
        </div>
    )
}

export default PalletClient