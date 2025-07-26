import React from 'react'

export const EntityFooter = ({ children }) => {
    return (
        <div className="px-6 py-2 grid gap-3 md:flex md:justify-between md:items-center border-t border-foreground-200">
            {children}
        </div>
    )
}
