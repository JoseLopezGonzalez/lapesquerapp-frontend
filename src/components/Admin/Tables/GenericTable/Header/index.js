import React, { Children } from 'react'

export const Header = ({data , children}) => {

    const { title, description } = data;

    return (
        <div className="px-6 py-4 pt-6 grid gap-3 md:flex md:justify-between md:items-center  ">
            <div>
                <h2 className="text-xl font-medium ">
                    {title}
                </h2>
                <p className="text-sm text-muted-foreground">
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
