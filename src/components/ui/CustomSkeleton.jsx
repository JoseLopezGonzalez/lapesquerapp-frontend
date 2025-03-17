// components/ui/CustomSkeleton.jsx

const CustomSkeleton = ({ className = "" }) => {
    return (
        <div className={`relative overflow-hidden rounded-md bg-neutral-800 ${className}`} >
            <div className={` absolute inset-0 h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-neutral-700/40 to-transparent`} />
        </div>
    );
};

export default CustomSkeleton;
