'use client'

import { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { PiChartLineUp } from 'react-icons/pi';
import { getTotalInventoryBySpecies } from '@/app/services/stores/stats/getTotalInventoryBySpecies';



const SpeciesInventoryOverview = () => {
    const [loading, setLoading] = useState(true)
    const [totalSpeciesInventory, setTotalSpeciesInventory] = useState([])

    useEffect(() => {
        setLoading(true)
        getTotalInventoryBySpecies()
            .then(data => {
                setTotalSpeciesInventory(data);
                setLoading(false)
            })
    }, [])


    return (
        <>
            {/* <!-- Card-- > */}
            <div className='bg-gradient-to-br from-sky-500/50 via-sky-700/50 to-sky-500 p-[1px] rounded-2xl'>
                <div className="p-4 md:p-5  flex flex-col  shadow-sm rounded-2xl bg-gradient-to-br from-sky-500 via-sky-700 to-sky-500 ">
                    {/* <!-- Header --> */}
                    <div className="flex justify-between items-start">
                        <div className='flex flex-col items-start '>
                            <h2 className="text-sm text-white text-nowrap">
                                Inventario por especies
                            </h2>
                            <div className='flex items-center justify-center gap-2'>
                                <p className="text-xl sm:text-xl font-medium text-neutral-100/85 text-nowrap">
                                    {totalSpeciesInventory?.totalNetWeight && totalSpeciesInventory?.totalNetWeight > 0
                                        ? new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2 , useGrouping:true }).format(totalSpeciesInventory?.totalNetWeight)
                                        : `0,00`
                                    }&nbsp;kg
                                </p>
                            </div>
                        </div>
                        {/* Boton acceder a almacenes */}
                        <div className='flex flex-row  items-center justify-center gap-2 overflow-hidden'>
                            <button
                                onClick={() => window.location.href = '/stores_manager'}
                                className="flex gap-2  rounded-lg items-center justify-center  p-1.5 px-4 bg-neutral-900/20  animate-pulse ">
                                <span className='text-xs font-thin text-white/85 '>Almacenes</span>
                                <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        </div>


                    </div>
                    {/* <!-- End Header --> */}
                    <div className='flex items-center justify-center w-full px-5  '>

                        {loading ? (

                            <div className="animate-pulse flex items-center justify-center p-4 h-[258px] w-full ">
                                <div className="flex items-center justify-center">
                                    <svg aria-hidden="true" className=" inline w-10 h-10 animate-spin text-white/20 fill-sky-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                    </svg>
                                    <br />
                                    <span className="text-white dark:text-neutral-400 pt-2 ml-2 sr-only">Cargando...</span>
                                </div>
                            </div>

                        ) : totalSpeciesInventory?.speciesInventory.length > 0 ? (
                            <div className='py-[40.5px] flex flex-col sm:flex-row items-center justify-center w-full gap-5'>
                                <img src="/app/dashboard/3d_box.svg" alt="3d box" className="w-36 h-36 px-2 " />
                                <div className='flex items-center justify-center w-full'>

                                    <div className=" flex flex-col w-full h-full overflow-y-auto max-h-[175px] pr-2">
                                        <table className=" text-sm  w-full ">
                                            <tbody className='divide-y divide-sky-700/20'>
                                                {totalSpeciesInventory.speciesInventory?.map((item, index) => (
                                                    <tr key={index} className=" hover:bg-neutral-800/20">
                                                        <td className='  py-3  text-sm text-white  sm:pl-6 '>
                                                            <span className="text-white font-medium">
                                                                {item.name}
                                                            </span>
                                                        </td>
                                                        <td className='text-end font-light py-3  text-sm text-white sm:pl-6 text-nowrap'>
                                                            <span className="text-white">
                                                                {new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2 , useGrouping:true }).format(item?.totalNetWeight)} kg

                                                            </span>
                                                        </td>
                                                        <td className='text-end py-3  text-sm text-sky-300  sm:pl-6 text-nowrap'>
                                                            <span>
                                                                {item.percentage.toFixed(2)} %

                                                            </span>
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center h-[258px]">
                                <div className='flex flex-col items-center justify-center gap-1'>
                                    <PiChartLineUp className='h-10 w-10 text-neutral-100/85' />
                                    <div className='flex flex-col items-center justify-center'>
                                        <span className='text-md text-neutral-100/85 '>No existe Stock</span>
                                        <p className='text-xs text-neutral-100/85 font-light'>Prueba a añadir algun palet a un almacen.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div >

                </div >
            </div >
            {/* <!--End Card-- > */}
        </>
    )
}

export default SpeciesInventoryOverview