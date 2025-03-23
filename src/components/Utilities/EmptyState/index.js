import { Button } from '@/components/ui/button'
import { Package, PlusCircle, SearchX } from 'lucide-react'
import React from 'react'

export const EmptyState = ({ title, description, icon, button }) => {
    return (
        <>
            <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                        {icon ?
                            icon
                            :
                            (
                                <SearchX className="h-12 w-12 text-primary" strokeWidth={1.5} />
                            )
                        }
                    </div>
                </div>

                <h2 className="mt-8 text-xl font-medium tracking-tight">{title}</h2>

                <p className="mt-3 mb-2 text-center text-muted-foreground max-w-[300px] text-sm  whitespace-normal">
                    {description}
                </p>

                {button &&
                    <Button
                        size="lg"
                        className="gap-2 px-6 font-medium shadow-sm transition-all hover:shadow hover:translate-y-[-1px] mt-6"
                        onClick={button.onClick}
                    >
                        <PlusCircle className="h-4 w-4" />
                        {button.name}
                    </Button>}

                <div className="mt-5 text-xs text-muted-foreground">
                    <p>
                        ¿Necesitas ayuda?{" "}
                        <a href="#" className="text-primary underline underline-offset-2">
                            Mira la guía
                        </a>
                    </p>
                </div>
            </div>
            {/* <div className='flex flex-col gap-6'>
                <div className='flex flex-col items-center justify-center'>
                    <div className=' z-[3] flex gap-2 border-1 rounded-lg p-1.5 bg-neutral-600 border-neutral-500 items-center justify-center'>
                        <div className='bg-neutral-400 w-7 h-7 rounded-lg'></div>
                        <div className=' w-28 h-8 flex flex-col justify-between py-1.5'>
                            <div className='bg-neutral-400 w-[60%] h-1.5 rounded-full'></div>
                            <div className='bg-neutral-400 w-full h-1.5 rounded-full'></div>
                        </div>
                    </div>
                    <div className='z-[2] -mt-5 flex gap-2 border-1 rounded-lg p-1.5 bg-neutral-600/80 border-neutral-500/80 items-center justify-center'>
                        <div className='bg-neutral-400/80 w-7 h-7 rounded-lg'></div>
                        <div className=' w-24 h-8 flex flex-col justify-between py-1.5'>
                            <div className='bg-neutral-400/80 w-[60%] h-1.5 rounded-full'></div>
                            <div className='bg-neutral-400/80 w-full h-1.5 rounded-full'></div>
                        </div>
                    </div>
                    <div className='z-[1] -mt-5 flex gap-2 border-1 rounded-lg p-1.5 bg-neutral-600/50 border-neutral-500/50 items-center justify-center'>
                        <div className='bg-neutral-400/50 w-7 h-7 rounded-lg'></div>
                        <div className=' w-20 h-8 flex flex-col justify-between py-1.5'>
                            <div className='bg-neutral-400/50 w-[60%] h-1.5 rounded-full'></div>
                            <div className='bg-neutral-400/50 w-full h-1.5 rounded-full'></div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col items-center justify-center gap-0.5'>
                    <h5>{title}</h5>
                    <p className='text-sm font-light text-white/50'>{description}</p>
                </div>
            </div> */}
        </>
    )
}
