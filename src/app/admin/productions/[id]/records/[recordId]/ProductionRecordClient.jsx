'use client'

import ProductionRecordEditor from '@/components/Admin/Productions/ProductionRecordEditor'
import React from 'react'

const ProductionRecordClient = ({ productionId, recordId }) => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <ProductionRecordEditor
                productionId={productionId}
                recordId={recordId}
            />
        </div>
    )
}

export default ProductionRecordClient

