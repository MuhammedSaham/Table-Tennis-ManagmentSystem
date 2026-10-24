import React from "react";
import { EnvelopeIcon, PhoneIcon, UserIcon } from "@heroicons/react/24/outline";
import { getProfileImageUrl } from "../services/api";

export interface RefereeProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
}

interface RefereeProfileCardProps {
  referee?: RefereeProfile | null;
  loading?: boolean;
}

const RefereeProfileCard: React.FC<RefereeProfileCardProps> = ({
  referee,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex min-w-[250px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-2 w-44 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!referee) {
    return (
      <div className="flex min-w-[250px] items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
          <UserIcon className="h-6 w-6 text-slate-400" />
        </div>
        <span>No referee assigned</span>
      </div>
    );
  }

  const name = `${referee.firstName} ${referee.lastName}`.trim();
  const imageUrl = getProfileImageUrl(referee.profileImage);

  return (
    <div className="flex min-w-[250px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} profile`}
          className="h-12 w-12 shrink-0 rounded-full border-2 border-cyan-200 object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cyan-200 bg-cyan-50">
          <UserIcon className="h-6 w-6 text-cyan-600" />
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{name}</p>
        <div className="mt-1 space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5 truncate">
            <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
            <span className="truncate">{referee.email || "Email not provided"}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
            <span>{referee.phone || "Phone not provided"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefereeProfileCard;
