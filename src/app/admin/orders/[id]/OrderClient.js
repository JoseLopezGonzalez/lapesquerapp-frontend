'use client'

import Order from '@/components/Admin/OrdersManager/Order'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'

const OrderClient = ({ orderId }) => {
    const router = useRouter()
    const isMobile = useIsMobile()

    const handleClose = () => {
        router.back()
    }

    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <Order orderId={orderId} onClose={isMobile ? handleClose : undefined} />
        </div>
    )
}

export default OrderClient