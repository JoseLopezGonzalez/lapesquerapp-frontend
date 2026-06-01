'use client';

import { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { PiChartLineUp } from 'react-icons/pi';
import { getRawMatertialReceptionDailybyProductsStats } from '@/services/rawMaterialReception/stats/getRawMatertialReceptionDailybyProductsStats';
import { getSpecies } from '@/services/species/getSpecies';

/* add fill key to stats.totalNetWeightByProducts */
const addFill = (data) => {
  return {
    ...data,
    totalNetWeightByProducts: data.totalNetWeightByProducts.map((item, index) => {
      return {
        ...item,
        fill: `url(#colorUv${index + 1})`,
      };
    }),
  };
};

const currentDate = new Date().toISOString().slice(0, 10);
const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

const RawMaterialRadialBarChart = () => {
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [species, setSpecies] = useState(1);
  const [date, setDate] = useState(currentDate);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    setLoading(true);
    getRawMatertialReceptionDailybyProductsStats(date, species).then((data) => {
      /* Solo Para date = curentDate comprobar si data.totalNetWeight es 0 y hacer una llamada de nuevo pasando el dia anterior*/
      if (date === currentDate && data.totalNetWeight === 0) {
        getRawMatertialReceptionDailybyProductsStats(yesterday, species).then((data) => {
          setStats(addFill(data));
          setDate(yesterday);
          setLoading(false);
        });
      } else {
        setStats(addFill(data));
        setLoading(false);
      }
    });
  }, [date, species]);

  useEffect(() => {
    getSpecies().then((data) => setSpeciesOptions(data));
  }, []);

  const renderColorList = (index) => {
    switch (index) {
      case 0:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-sky-700"></div>;
      case 1:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-fuchsia-700"></div>;
      case 2:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-rose-700"></div>;
      case 3:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-purple-700"></div>;
      case 4:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-lime-700"></div>;
      case 5:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-orange-700"></div>;
      case 6:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-teal-700"></div>;
      case 7:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-blue-700"></div>;
      default:
        return <div className="h-4 w-4 rounded-md border-2 border-white/30 bg-neutral-500"></div>;
    }
  };

  return (
    <>
      {/* <!-- Card-- > */}
      <div className="rounded-xl bg-gradient-to-br from-neutral-500/50 via-neutral-700/50 to-sky-500 p-[1px]">
        <div className="flex flex-col rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-sky-900 p-4 shadow-sm md:p-5">
          {/* <!-- Header --> */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
            <div className="flex flex-col items-start">
              <h2 className="text-base text-nowrap text-neutral-500 md:text-sm dark:text-neutral-500">
                Calibres diarios por especie
              </h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-medium text-nowrap text-neutral-800 md:text-xl dark:text-neutral-200">
                  {stats?.totalNetWeight && stats?.totalNetWeight === 0
                    ? `0,00 kg`
                    : new Intl.NumberFormat('es-ES', {
                        style: 'decimal',
                        minimumFractionDigits: 2,
                        useGrouping: true,
                      }).format(stats?.totalNetWeight)}{' '}
                  kg
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch justify-center gap-2 overflow-hidden sm:w-auto sm:flex-row sm:items-center">
              <select
                onChange={(e) => setSpecies(e.target.value)}
                value={species}
                className="block h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 p-2 px-3 text-base text-white placeholder-neutral-100 focus:ring-sky-500 sm:w-auto md:h-auto md:p-1.5 md:px-2 md:text-xs"
              >
                <option value="all">Todas las especies</option>
                {speciesOptions.map((specie) => (
                  <option key={specie.id} value={specie.id}>
                    {specie.name}
                  </option>
                ))}
              </select>
              <input
                onChange={(e) => setDate(e.target.value)}
                value={date}
                type="date"
                className="block h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 p-2 px-3 text-base text-white placeholder-neutral-100 focus:ring-sky-500 md:h-auto md:p-1.5 md:px-2 md:text-xs"
              />
            </div>
          </div>
          {/* <!-- End Header --> */}
          <div className="flex w-full items-center">
            {loading ? (
              <div className="flex h-[258px] w-full animate-pulse items-center justify-center p-4">
                <div className="flex items-center justify-center">
                  <svg
                    aria-hidden="true"
                    className="inline h-10 w-10 animate-spin fill-sky-500 text-neutral-600/50"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <br />
                  <span className="sr-only ml-2 pt-2 text-white dark:text-neutral-400">
                    Cargando...
                  </span>
                </div>
              </div>
            ) : stats?.totalNetWeightByProducts.length > 0 ? (
              <div className="flex w-full flex-col gap-4 py-4 sm:flex-row sm:py-0 md:py-6">
                <div className="flex items-center justify-center sm:w-[600px] sm:pt-1">
                  <ResponsiveContainer width="100%" height={220} className="md:h-[255px]">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="20%"
                      outerRadius="110%"
                      barSize={15}
                      data={stats?.totalNetWeightByProducts}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <defs>
                        <linearGradient id="colorUv1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(92, 157, 191)" />
                          <stop offset="50%" stopColor="rgb(2 132 199)" />
                          <stop offset="100%" stopColor="rgb(2 132 199)" />
                        </linearGradient>
                        <linearGradient id="colorUv2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(164, 92, 171)" />
                          <stop offset="50%" stopColor="rgb(162 28 175)" />
                          <stop offset="100%" stopColor="rgb(162 28 175)" />
                        </linearGradient>
                        <linearGradient id="colorUv3" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(212, 76, 109)" />
                          <stop offset="50%" stopColor="rgb(190 18 60)" />
                          <stop offset="100%" stopColor="rgb(190 18 60)" />
                        </linearGradient>
                        <linearGradient id="colorUv4" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(145, 95, 222)" />
                          <stop offset="50%" stopColor="rgb(109 40 217)" />
                          <stop offset="100%" stopColor="rgb(109 40 217)" />
                        </linearGradient>
                        <linearGradient id="colorUv5" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(134, 179, 75)" />
                          <stop offset="20%" stopColor="rgb(77 124 15)" />
                          <stop offset="100%" stopColor="rgb(77 124 15)" />
                        </linearGradient>
                        <linearGradient id="colorUv6" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(194, 107, 72)" />
                          <stop offset="20%" stopColor="rgb(194 65 12)" />
                          <stop offset="100%" stopColor="rgb(194 65 12)" />
                        </linearGradient>
                        <linearGradient id="colorUv7" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(70, 140, 135)" />
                          <stop offset="20%" stopColor="rgb(15 118 110)" />
                          <stop offset="100%" stopColor="rgb(15 118 110)" />
                        </linearGradient>
                        <linearGradient id="colorUv8" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgb(119, 140, 201)" />
                          <stop offset="20%" stopColor="rgb(29 78 216)" />
                          <stop offset="100%" stopColor="rgb(29 78 216)" />
                        </linearGradient>
                        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.00)" />
                          <stop offset="60%" stopColor="rgba(255, 255, 255, 0.08)" />
                          <stop offset="100%" stopColor="rgba(11, 57 ,86 ,0.50)" />
                        </linearGradient>
                      </defs>
                      <RadialBar
                        background={{ fill: 'url(#background)' }}
                        /* background = {{fill: 'rgba(255, 255, 255, 0.08)'}} */
                        minAngle={15}
                        clockWise
                        dataKey="totalNetWeight"
                        cornerRadius={10}
                      />
                      {/*  <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={style} /> */}
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex w-full items-center justify-center px-2 sm:px-14">
                  <ul className="mt-3 flex h-full max-h-[180px] w-full flex-col overflow-y-auto pr-2">
                    {stats?.totalNetWeightByProducts.map((item, index) => (
                      <li
                        key={index}
                        className="inline-flex min-h-[44px] items-center gap-x-2 border-b border-neutral-400 px-4 py-3 text-base text-neutral-200 md:py-3 md:text-sm"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                            {renderColorList(index)}
                            <span className="truncate">{item.name}</span>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <span className="text-nowrap">
                              {new Intl.NumberFormat('es-ES', {
                                style: 'decimal',
                                minimumFractionDigits: 2,
                                useGrouping: true,
                              }).format(item?.totalNetWeight)}{' '}
                              kg
                            </span>
                            <span className="w-10 text-end font-medium text-nowrap text-sky-300">
                              {item?.percentage?.toFixed(0)} %
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex h-[258px] w-full flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <PiChartLineUp className="h-10 w-10 text-neutral-100/85" />
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md text-neutral-100/85">No existen datos</span>
                    <p className="text-xs font-light text-neutral-100/85">
                      Prueba a filtrar por otro día o especie.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <!--End Card-- > */}
    </>
  );
};

export default RawMaterialRadialBarChart;
