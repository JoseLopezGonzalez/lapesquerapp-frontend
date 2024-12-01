import React from "react";

export const GenericTable = ({ children }) => {


  return (
    <div className='w-full h-full p-3 sm:p-12'>

      {/* <!-- Card --> */}
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-full -m-1.5">
          <div className="w-full h-full p-1.5 min-w-full inline-block align-middle">
            <div className="w-full h-full flex flex-col border rounded-xl shadow-sm  bg-neutral-900/50 border-neutral-700">

              {children}

            </div>
          </div>
        </div>
      </div>
      {/* <!-- End Card --> */}


    </div>
  );
};
