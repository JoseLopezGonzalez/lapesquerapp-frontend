'use client'

import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PiChartLineUp } from "react-icons/pi";
import { getRawMaterialReceptionMonthlyStats } from '@/services/rawMaterialReception/stats/getRawMatertialReceptionMonthlyStats';


const MonthlyChart = ({ species, setDataFilterUi, setNetWeight, setPercentageChange }) => {
    const [stats, setStats] = useState([])
    const [month, setMonth] = useState()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        setDataFilterUi(
            <input
                onChange={(e) => setMonth(e.target.value)}
                value={month}
                type="month" className="border text-xs rounded-lg block w-full p-1.5 px-2 bg-neutral-900 border-neutral-600 placeholder-neutral-100 text-white focus:ring-sky-500 "
            />
        )
        getRawMaterialReceptionMonthlyStats(month, species)
            .then(data => {
                setStats(data);
                setNetWeight(data.totalNetWeight);
                setPercentageChange(data.percentageChange);
                setLoading(false)
            })
    }, [month, species])

    useEffect(() => {
        const date = new Date()
        const currentMonth = date.toISOString().slice(0, 7)
        setMonth(currentMonth)
    }, [])


    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-800/45 border border-neutral-700 p-3 rounded-lg backdrop-blur-lg drop-shadow-lg	">
                    {payload.map((data, index) => (
                        <di key={index}>
                            <p className=' text-sm'>{data.payload.name}</p>
                            <p className="text-sm font-semibold" key={index} style={{ color: data.color, margin: 0 }}>
                                {`${data.value.toFixed(2)} kg`}
                            </p>
                        </di>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <>
            {loading ? (
                <div className="animate-pulse flex items-center justify-center p-0 sm:p-4  pt-10 h-[140px]">
                    <div className="flex items-center justify-center">
                        <svg aria-hidden="true" className=" inline w-10 h-10 animate-spin text-neutral-600/50 fill-sky-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                        </svg>
                        <br />
                        <span className="text-white dark:text-neutral-400 pt-2 ml-2 sr-only">Cargando...</span>
                    </div>
                </div>
            ) : stats?.dailyNetWeights.length > 0 ? (
                <div className='flex items-center justify-center pr-4 pt-10'>
                    <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={stats?.dailyNetWeights}>
                            <defs>
                                <linearGradient id="colorCurrentMonth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="rgb(14 165 233)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="rgb(14 165 233)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis tick={false} stroke="white" />
                            <YAxis stroke="white" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="currentMonth" stroke="rgb(14 165 233)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCurrentMonth)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center justify-center h-[175px]">
                    <div className='flex flex-col items-center justify-center gap-1'>
                        <PiChartLineUp className='h-10 w-10 text-neutral-100/85' />
                        <div className='flex flex-col items-center justify-center'>
                            <span className='text-md text-neutral-100/85 '>No existen datos</span>
                            <p className='text-xs text-neutral-100/85 font-light'>Prueba a filtrar por otros meses.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default MonthlyChart