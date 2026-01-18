'use client'

import { useEffect, useState } from 'react'
import { Tab } from '@headlessui/react'
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon } from '@heroicons/react/20/solid'
import { classNames } from '@/helpers/styles/classNames'
import MonthlyChart from './MonthlyChart'
import AnnualChart from './AnnualChart'
import { getSpecies } from '@/services/species/getSpecies'

const RawAreaChart = () => {

    const [dataFilterUi, setDataFilterUi] = useState()
    const [speciesOptions, setSpeciesOptions] = useState([])
    const [species, setSpecies] = useState()
    const [netWeight, setNetWeight] = useState(0)
    const [percentageChange, setPercentageChange] = useState(0)

    useEffect(() => {
        getSpecies().then(data => setSpeciesOptions(data))
        setSpecies(1)
    }, [])

    return (
        <>
            {/* <!-- Card-- > */}
            <div className='bg-gradient-to-br from-neutral-500/50 via-neutral-700/50 to-sky-500 p-[1px] rounded-xl'>
                <div className="p-4 md:p-5  flex flex-col  shadow-sm rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-sky-900 ">
                    {/* <!-- Header --> */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-5">
                        <div className='flex flex-col items-start '>
                            <h2 className="text-base md:text-sm text-neutral-500 dark:text-neutral-500 text-nowrap">
                                Recepciones de materia prima
                            </h2>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-center gap-2'>
                                <p className="text-2xl md:text-xl font-medium text-neutral-800 dark:text-neutral-200 text-nowrap">
                                    {netWeight && netWeight === 0
                                        ? `0,00 kg`
                                        : new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2 , useGrouping:true }).format(netWeight)} kg
                                </p>
                                <div className='text-nowrap'> 
                                {
                                    percentageChange != null ?
                                        percentageChange === -100 || percentageChange === 0
                                            ? <span className="py-2 md:py-[5px] px-2 md:px-1.5 inline-flex items-center gap-x-1 text-sm md:text-xs font-medium rounded-md text-sky-800 dark:text-sky-500">
                                                <ArrowsUpDownIcon className="h-5 w-5 md:h-4 md:w-4" />
                                                0 %
                                            </span>
                                            : percentageChange > 0
                                                ? <span className="py-2 md:py-[5px] px-2 md:px-1.5 inline-flex items-center gap-x-1 text-sm md:text-xs font-medium rounded-md text-green-800 dark:text-green-500">
                                                    <ArrowUpIcon className="h-5 w-5 md:h-4 md:w-4" />
                                                    {percentageChange.toFixed(2)} %
                                                </span>
                                                : <span className="py-2 md:py-[5px] px-2 md:px-1.5 inline-flex items-center gap-x-1 text-sm md:text-xs font-medium rounded-md text-red-800 dark:text-red-500">
                                                    <ArrowDownIcon className="h-5 w-5 md:h-4 md:w-4" />
                                                    {percentageChange.toFixed(2)} %
                                                </span>
                                        : null
                                }
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 overflow-hidden w-full sm:w-auto'>
                            <select
                                onChange={(e) => setSpecies(e.target.value)}
                                value={species}
                                className="border text-base md:text-xs rounded-lg block h-12 md:h-auto p-2 md:p-1.5 px-3 md:px-1 bg-neutral-900 border-neutral-600 placeholder-neutral-100 text-white focus:ring-sky-500 w-full sm:w-auto">
                                <option value="all">Todas las especies</option>
                                {speciesOptions.map(specie => <option key={specie.id} value={specie.id}>{specie.name}</option>)}
                            </select>
                            {dataFilterUi}
                        </div>
                    </div>
                    {/* <!-- End Header --> */}
                    <div className="w-full px-2 pt-6 md:pt-10 sm:px-0">
                        <Tab.Group>
                            <div className='flex items-center justify-center'>
                                <Tab.List className="flex space-x-1 rounded-xl p-1 border border-sky-900 font-thin text-base md:text-sm min-w-full md:min-w-80 bg-sky-900/10 w-full md:w-auto">
                                    <Tab className={({ selected }) =>
                                        classNames(
                                            'w-full rounded-lg py-2 md:py-1 leading-5 min-h-[44px] md:min-h-0 flex items-center justify-center',
                                            'focus:outline-none',
                                            selected
                                                ? 'bg-sky-900/50 text-neutral-200 font-medium shadow'
                                                : 'text-neutral-300 hover:bg-black/[0.15] hover:text-white hover:font-normal'
                                        )
                                    }>
                                        Año
                                    </Tab>
                                    <Tab className={({ selected }) =>
                                        classNames(
                                            'w-full rounded-lg py-2 md:py-1 leading-5 min-h-[44px] md:min-h-0 flex items-center justify-center',
                                            'focus:outline-none',
                                            selected
                                                ? 'bg-sky-900/50 text-neutral-200 font-medium shadow'
                                                : 'text-neutral-300 hover:bg-black/[0.12] hover:text-white hover:font-normal'
                                        )
                                    }>
                                        Mes
                                    </Tab>
                                </Tab.List>
                            </div>
                            <Tab.Panels>
                                <Tab.Panel>
                                    <AnnualChart species={species} setDataFilterUi={setDataFilterUi} setNetWeight={setNetWeight} setPercentageChange={setPercentageChange} />
                                </Tab.Panel>
                                <Tab.Panel className="w-full">
                                    <MonthlyChart species={species} setDataFilterUi={setDataFilterUi} setNetWeight={setNetWeight} setPercentageChange={setPercentageChange} />
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                </div >
            </div>
            {/* <!--End Card-- > */}
        </>
    )
}

export default RawAreaChart