import React from "react";

export const GenericTable = ({ children }) => {


  return (
    <div className='w-full h-full '>

      {/* <!-- Card --> */}
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-full">
          <div className="w-full h-full  min-w-full inline-block align-middle">
            <div className="w-full h-full flex flex-col  rounded-2xl shadow-sm  bg-neutral-900 ">

              {children}

            </div>
          </div>
        </div>
      </div>
      {/* <!-- End Card --> */}


    </div>
  );
};
