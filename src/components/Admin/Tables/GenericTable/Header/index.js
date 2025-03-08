import React, { Children } from 'react'

export const Header = ({data , children}) => {

    const { title, description } = data;

    return (
        <div className="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-b ">
            <div>
                <h2 className="text-xl font-semibold text-neutral-200">
                    {title}
                </h2>
                <p className="text-sm text-neutral-400">
                    {description}
                </p>
            </div>

            <div>
                <div className="inline-flex gap-x-2">
                    {children}
                </div>
            </div>
        </div>
    )
}
