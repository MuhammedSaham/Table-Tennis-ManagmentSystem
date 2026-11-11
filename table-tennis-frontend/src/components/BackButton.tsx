import React from "react";
import { Link, useNavigate } from "react-router-dom";

export interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  label: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  onClick,
  label,
  className = "",
}) => {
  const navigate = useNavigate();
  const baseClasses =
    "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-[#061D23]/40 hover:bg-[#061D23]/80 px-3.5 py-1.5 text-xs font-bold text-[#4AEEFF] hover:text-white shadow-sm backdrop-blur-md transition-all group active:scale-95";

  const content = (
    <>
      <svg
        className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick || (() => navigate(-1))}
      className={`${baseClasses} ${className}`}
    >
      {content}
    </button>
  );
};

export default BackButton;

