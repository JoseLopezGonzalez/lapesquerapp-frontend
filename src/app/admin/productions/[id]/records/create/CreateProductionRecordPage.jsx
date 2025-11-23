'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getProductionRecords } from '@/services/productionService'
import CreateProductionRecordForm from '@/components/Admin/Productions/CreateProductionRecordForm'
import { Skeleton } from '@/components/ui/skeleton'

const CreateProductionRecordPage = ({ productionId }) => {
    const { data: session } = useSession()
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.accessToken && productionId) {
            loadRecords()
        }
    }, [session, productionId])

    const loadRecords = async () => {
        try {
            const token = session.user.accessToken
            const response = await getProductionRecords(token, { production_id: productionId })
            setRecords(response.data || [])
        } catch (err) {
            console.error('Error loading records:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        // El formulario maneja la redirección
    }

    if (loading) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-6 space-y-6">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    return (
        <CreateProductionRecordForm
            productionId={productionId}
            existingRecords={records}
            onSuccess={handleSuccess}
            mode="page"
        />
    )
}

export default CreateProductionRecordPage

