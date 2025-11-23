'use client'

import ProductionView from '@/components/Admin/Productions/ProductionView'
import React from 'react'

const ProductionClient = ({ productionId }) => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <ProductionView
                productionId={productionId}
            />
        </div>
    )
}

export default ProductionClient

