'use client'

import ProductionRecordView from '@/components/Admin/Productions/ProductionRecordView'
import React from 'react'

const ProductionRecordClient = ({ productionId, recordId }) => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <ProductionRecordView
                productionId={productionId}
                recordId={recordId}
            />
        </div>
    )
}

export default ProductionRecordClient

