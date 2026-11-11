import React from "react";

export interface GlassSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  containerClassName?: string;
  iconColor?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  children,
  className = "",
  containerClassName = "",
  iconColor = "text-[#4AEEFF]",
  ...rest
}) => {
  return (
    <div className={`relative ${containerClassName}`}>
      <select
        className={`appearance-none rounded-xl border border-white/20 bg-[#061D23]/60 hover:bg-[#061D23]/85 px-3.5 py-2 pr-9 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(6,29,35,0.4)] backdrop-blur-xl focus:border-[#4AEEFF] focus:ring-1 focus:ring-[#4AEEFF] focus:outline-none transition-all cursor-pointer ${className}`}
        {...rest}
      >
        {children}
      </select>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 ${iconColor}`}
      >
        <svg
          className="w-4 h-4 fill-none stroke-current stroke-2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>
    </div>
  );
};

export default GlassSelect;

