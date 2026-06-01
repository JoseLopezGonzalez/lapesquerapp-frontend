import React from 'react';

export const EntityFooter = ({ children }) => {
  return (
    <div className="border-foreground-200 grid gap-3 border-t px-6 py-2 md:flex md:items-center md:justify-between">
      {children}
    </div>
  );
};
