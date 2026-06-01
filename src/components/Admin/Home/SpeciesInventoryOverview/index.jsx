'use client';

import { useEffect, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { PiChartLineUp } from 'react-icons/pi';
import { getTotalInventoryBySpecies } from '@/services/stores/stats/getTotalInventoryBySpecies';

const SpeciesInventoryOverview = () => {
  const [loading, setLoading] = useState(true);
  const [totalSpeciesInventory, setTotalSpeciesInventory] = useState([]);

  useEffect(() => {
    setLoading(true);
    getTotalInventoryBySpecies().then((data) => {
      setTotalSpeciesInventory(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      {/* <!-- Card-- > */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-500/50 via-sky-700/50 to-sky-500 p-[1px]">
        <div className="flex flex-col rounded-2xl bg-gradient-to-br from-sky-500 via-sky-700 to-sky-500 p-4 shadow-sm md:p-5">
          {/* <!-- Header --> */}
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="flex flex-col items-start">
              <h2 className="text-base text-nowrap text-white md:text-sm">
                Inventario por especies
              </h2>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-medium text-nowrap text-neutral-100/85 md:text-xl">
                  {totalSpeciesInventory?.totalNetWeight &&
                  totalSpeciesInventory?.totalNetWeight > 0
                    ? new Intl.NumberFormat('es-ES', {
                        style: 'decimal',
                        minimumFractionDigits: 2,
                        useGrouping: true,
                      }).format(totalSpeciesInventory?.totalNetWeight)
                    : `0,00`}
                  &nbsp;kg
                </p>
              </div>
            </div>
            {/* Boton acceder a almacenes */}
            <div className="flex w-full flex-row items-center justify-center gap-2 overflow-hidden sm:w-auto">
              <button
                onClick={() => (window.location.href = '/stores_manager')}
                className="flex min-h-[44px] w-full animate-pulse items-center justify-center gap-2 rounded-lg bg-neutral-900/20 px-4 py-2 sm:w-auto"
              >
                <span className="text-sm font-thin text-white/85 md:text-xs">Almacenes</span>
                <ArrowRightIcon className="h-5 w-5 md:h-4 md:w-4" />
              </button>
            </div>
          </div>
          {/* <!-- End Header --> */}
          <div className="flex w-full items-center justify-center px-5">
            {loading ? (
              <div className="flex h-[258px] w-full animate-pulse items-center justify-center p-4">
                <div className="flex items-center justify-center">
                  <svg
                    aria-hidden="true"
                    className="inline h-10 w-10 animate-spin fill-sky-500 text-white/20"
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
            ) : totalSpeciesInventory?.speciesInventory.length > 0 ? (
              <div className="flex w-full flex-col items-center justify-center gap-4 py-6 sm:flex-row md:gap-5 md:py-[40.5px]">
                <img
                  src="/app/dashboard/3d_box.svg"
                  alt="3d box"
                  className="hidden h-24 w-24 px-2 sm:block md:h-36 md:w-36"
                />
                <div className="flex w-full items-center justify-center">
                  <div className="flex h-full max-h-[175px] w-full flex-col overflow-y-auto pr-2">
                    <table className="w-full text-sm md:text-sm">
                      <tbody className="divide-y divide-sky-700/20">
                        {totalSpeciesInventory.speciesInventory?.map((item, index) => (
                          <tr key={index} className="hover:bg-neutral-800/20">
                            <td className="py-3 text-base text-white sm:pl-6 md:py-3 md:text-sm">
                              <span className="font-medium text-white">{item.name}</span>
                            </td>
                            <td className="py-3 text-end text-base font-light text-nowrap text-white sm:pl-6 md:py-3 md:text-sm">
                              <span className="text-white">
                                {new Intl.NumberFormat('es-ES', {
                                  style: 'decimal',
                                  minimumFractionDigits: 2,
                                  useGrouping: true,
                                }).format(item?.totalNetWeight)}{' '}
                                kg
                              </span>
                            </td>
                            <td className="py-3 text-end text-base text-nowrap text-sky-300 sm:pl-6 md:py-3 md:text-sm">
                              <span>{item.percentage.toFixed(2)} %</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[258px] w-full flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <PiChartLineUp className="h-10 w-10 text-neutral-100/85" />
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-md text-neutral-100/85">No existe Stock</span>
                    <p className="text-xs font-light text-neutral-100/85">
                      Prueba a añadir algun palet a un almacen.
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

export default SpeciesInventoryOverview;
