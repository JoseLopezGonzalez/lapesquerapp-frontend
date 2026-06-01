'use client';

import { useEffect, useState } from 'react';
import { Tab } from '@headlessui/react';
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon } from '@heroicons/react/20/solid';
import { classNames } from '@/helpers/styles/classNames';
import MonthlyChart from './MonthlyChart';
import AnnualChart from './AnnualChart';
import { getSpecies } from '@/services/species/getSpecies';

const RawAreaChart = () => {
  const [dataFilterUi, setDataFilterUi] = useState();
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [species, setSpecies] = useState();
  const [netWeight, setNetWeight] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);

  useEffect(() => {
    getSpecies().then((data) => setSpeciesOptions(data));
    setSpecies(1);
  }, []);

  return (
    <>
      {/* <!-- Card-- > */}
      <div className="rounded-xl bg-gradient-to-br from-neutral-500/50 via-neutral-700/50 to-sky-500 p-[1px]">
        <div className="flex flex-col rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-sky-900 p-4 shadow-sm md:p-5">
          {/* <!-- Header --> */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-5">
            <div className="flex flex-col items-start">
              <h2 className="text-base text-nowrap text-neutral-500 md:text-sm dark:text-neutral-500">
                Recepciones de materia prima
              </h2>
              <div className="flex flex-col items-start justify-center gap-2 sm:flex-row sm:items-center">
                <p className="text-2xl font-medium text-nowrap text-neutral-800 md:text-xl dark:text-neutral-200">
                  {netWeight && netWeight === 0
                    ? `0,00 kg`
                    : new Intl.NumberFormat('es-ES', {
                        style: 'decimal',
                        minimumFractionDigits: 2,
                        useGrouping: true,
                      }).format(netWeight)}{' '}
                  kg
                </p>
                <div className="text-nowrap">
                  {percentageChange != null ? (
                    percentageChange === -100 || percentageChange === 0 ? (
                      <span className="inline-flex items-center gap-x-1 rounded-md px-2 py-2 text-sm font-medium text-sky-800 md:px-1.5 md:py-[5px] md:text-xs dark:text-sky-500">
                        <ArrowsUpDownIcon className="h-5 w-5 md:h-4 md:w-4" />0 %
                      </span>
                    ) : percentageChange > 0 ? (
                      <span className="inline-flex items-center gap-x-1 rounded-md px-2 py-2 text-sm font-medium text-green-800 md:px-1.5 md:py-[5px] md:text-xs dark:text-green-500">
                        <ArrowUpIcon className="h-5 w-5 md:h-4 md:w-4" />
                        {percentageChange.toFixed(2)} %
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-x-1 rounded-md px-2 py-2 text-sm font-medium text-red-800 md:px-1.5 md:py-[5px] md:text-xs dark:text-red-500">
                        <ArrowDownIcon className="h-5 w-5 md:h-4 md:w-4" />
                        {percentageChange.toFixed(2)} %
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch justify-center gap-2 overflow-hidden sm:w-auto sm:flex-row sm:items-center">
              <select
                onChange={(e) => setSpecies(e.target.value)}
                value={species}
                className="block h-12 w-full rounded-lg border border-neutral-600 bg-neutral-900 p-2 px-3 text-base text-white placeholder-neutral-100 focus:ring-sky-500 sm:w-auto md:h-auto md:p-1.5 md:px-1 md:text-xs"
              >
                <option value="all">Todas las especies</option>
                {speciesOptions.map((specie) => (
                  <option key={specie.id} value={specie.id}>
                    {specie.name}
                  </option>
                ))}
              </select>
              {dataFilterUi}
            </div>
          </div>
          {/* <!-- End Header --> */}
          <div className="w-full px-2 pt-6 sm:px-0 md:pt-10">
            <Tab.Group>
              <div className="flex items-center justify-center">
                <Tab.List className="flex w-full min-w-full space-x-1 rounded-xl border border-sky-900 bg-sky-900/10 p-1 text-base font-thin md:w-auto md:min-w-80 md:text-sm">
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        'flex min-h-[44px] w-full items-center justify-center rounded-lg py-2 leading-5 md:min-h-0 md:py-1',
                        'focus:outline-none',
                        selected
                          ? 'bg-sky-900/50 font-medium text-neutral-200 shadow'
                          : 'text-neutral-300 hover:bg-black/[0.15] hover:font-normal hover:text-white'
                      )
                    }
                  >
                    Año
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        'flex min-h-[44px] w-full items-center justify-center rounded-lg py-2 leading-5 md:min-h-0 md:py-1',
                        'focus:outline-none',
                        selected
                          ? 'bg-sky-900/50 font-medium text-neutral-200 shadow'
                          : 'text-neutral-300 hover:bg-black/[0.12] hover:font-normal hover:text-white'
                      )
                    }
                  >
                    Mes
                  </Tab>
                </Tab.List>
              </div>
              <Tab.Panels>
                <Tab.Panel>
                  <AnnualChart
                    species={species}
                    setDataFilterUi={setDataFilterUi}
                    setNetWeight={setNetWeight}
                    setPercentageChange={setPercentageChange}
                  />
                </Tab.Panel>
                <Tab.Panel className="w-full">
                  <MonthlyChart
                    species={species}
                    setDataFilterUi={setDataFilterUi}
                    setNetWeight={setNetWeight}
                    setPercentageChange={setPercentageChange}
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
      {/* <!--End Card-- > */}
    </>
  );
};

export default RawAreaChart;
