import { Card } from "@/components/ui/card";
import React from "react";

export const GenericTable = ({ children }) => {


  return (
    <div className='w-full h-full '>

      {/* <!-- Card --> */}
      {/* <div className="w-full h-full flex flex-col">
        <div className="w-full h-full">
          <div className="w-full h-full  min-w-full inline-block align-middle"> */}
            <Card className="w-full h-full flex flex-col  rounded-2xl shadow-sm   ">

              {children}

            </Card>
         {/*  </div>
        </div>
      </div> */}
      {/* <!-- End Card --> */}


    </div>
  );
};
