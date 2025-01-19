import { NAVBAR_LOGO } from "@/configs/config";

const UnauthorizedPage = () => {
    return (
        <div className="h-[100vh] w-full flex flex-col mx-auto ">
            <div className="mb-auto flex justify-center z-50 w-full py-4">
                <nav className="px-4 sm:px-6 lg:px-8">
                    <a className="flex-none text-xl font-semibold sm:text-3xl dark:text-red-500" href="#" aria-label="Brand">
                         <img className="h-14 w-auto" src={NAVBAR_LOGO} alt="skyApp" />
                    </a>
                </nav>
            </div>

            <div id="content">
                <div className="text-center py-10 px-4 sm:px-6 lg:px-8">
                    <h1 className="block text-7xl font-bold text-gray-800 sm:text-9xl dark:text-white">403</h1>
                    <p className="mt-3 text-gray-600 dark:text-neutral-400">Oops, parece que no estaś autorizado</p>
                    <p className="text-gray-600 dark:text-neutral-400">Contacta con el amdministrador del sistema</p>
                    <div className="mt-5 flex flex-col justify-center items-center gap-2 sm:flex-row sm:gap-3">
                        <a 
                        className="w-full sm:w-auto py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-sky-500 text-white hover:bg-sky-700 focus:outline-none focus:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none" 
                        href="/admin">
                            <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            Volver al inicio
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-auto text-center py-5">
                <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-500 dark:text-neutral-500">PescApp© All Rights Reserved. 2025.</p>
                </div>
            </div>
        </div>
    );

};

export default UnauthorizedPage;
