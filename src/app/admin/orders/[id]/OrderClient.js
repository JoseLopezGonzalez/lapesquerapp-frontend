'use client'

import Order from '@/components/Admin/OrdersManager/Order'
import React from 'react'

const OrderClient = ({ orderId }) => {
    return (
        <div className="h-full w-full p-14">
            <Order orderId={orderId} />
        </div>
    )
}

export default OrderClient