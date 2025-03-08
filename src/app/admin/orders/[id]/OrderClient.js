'use client'

import Order from '@/components/Admin/OrdersManager/Order'
import React from 'react'

const OrderClient = ({ orderId }) => {
    return (
        <div className="h-full w-full overflow-hidden rounded-xl">
            <Order orderId={orderId} />
        </div>
    )
}

export default OrderClient