import React from 'react'

export const Footer = ({ children }) => {
    return (
        <div className="px-6 py-5 grid gap-3 md:flex md:justify-between md:items-center border-t border-neutral-700">
            {children}
        </div>
    )
}
