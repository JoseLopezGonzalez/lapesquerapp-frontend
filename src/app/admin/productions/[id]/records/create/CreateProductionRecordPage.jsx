'use client'

import ProductionRecordEditor from '@/components/Admin/Productions/ProductionRecordEditor'
import React from 'react'

const CreateProductionRecordPage = ({ productionId }) => {
    return (
        <ProductionRecordEditor 
            productionId={productionId}
            recordId={null}
        />
    )
}

export default CreateProductionRecordPage

