import React from 'react'

export const EmptyState = ({title, description}) => {
    return (
        <div className='flex flex-col gap-6'>
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
        </div>
    )
}
