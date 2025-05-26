import React from 'react'

export const Footer = ({ children }) => {
    return (
        <div className="px-6 py-5 grid gap-3 md:flex md:justify-between md:items-center border-t border-foreground-200">
            {children}
        </div>
    )
}
