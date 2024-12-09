'use client'

export const Footer = ({ children }) => {
    return (
        <div className={`p-4  flex justify-end gap-2`}>
            {children}
        </div>
    );
};
