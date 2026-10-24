import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, UserIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api, { getProfileImageUrl } from "../services/api";

interface AssignedMatch {
  id: string;
  round?: string;
  matchNumber?: number;
  status: string;
  score?: string | null;
  scheduledTime: string;
  tournament?: { id: string; name: string };
  category?: { id: string; name: string };
  group?: {
    tournament: { id: string; name: string };
    category: { id: string; name: string };
  };
}

interface UserDetailsData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  profileImage: string | null;
  createdAt: string;
  permissions: string[];
  refereeProfile?: {
    certification: string | null;
    experienceYears: number | null;
    matches: AssignedMatch[];
    groupMatches: AssignedMatch[];
  } | null;
  adminProfile?: { department: string | null } | null;
}

const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const response = await api.get(`/users/${userId}`);
        const data = response.data.data as UserDetailsData;
        if (data.role !== "ADMIN" && data.role !== "SUPER_ADMIN" && data.role !== "REFEREE") {
          toast.error("Only Admin and Referee profiles are available here.");
          navigate("/app/users", { replace: true });
          return;
        }
        setProfile(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load user profile");
        navigate("/app/users", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate, userId]);

  const wrapInProfileLayout = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return wrapInProfileLayout(
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#4AEEFF]" />
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#4AEEFF]">
          Loading profile...
        </div>
      </div>,
    );
  }

  if (!profile) return null;

  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const imageUrl = getProfileImageUrl(profile.profileImage);
  const assignedMatches = [
    ...(profile.refereeProfile?.matches || []),
    ...(profile.refereeProfile?.groupMatches || []),
  ];
  const permissionLabel = (permission: string) =>
    permission
      .replace(/^MANAGE_/, "")
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return wrapInProfileLayout(
    <>
      <Link to="/app/users" className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-[#4AEEFF]">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Users
      </Link>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {imageUrl ? (
            <img src={imageUrl} alt={`${name} profile`} className="h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-lg sm:h-24 sm:w-24" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#12679E]/40 to-white/5 text-4xl font-black text-white shadow-lg sm:h-24 sm:w-24">
              <UserIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
          )}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{name}</h1>
              <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {profile.role === "REFEREE" ? "Referee" : "Admin"}
              </span>
            </div>
            <div className="space-y-1 text-xs text-white/60">
              <p className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-[#4AEEFF]" />{profile.email}</p>
              <p className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-[#4AEEFF]" />{profile.phone || "Phone not provided"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-white">Profile Details</h2>
        <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
          <p><span className="text-white/40">Joined:</span> {new Date(profile.createdAt).toLocaleDateString()}</p>
          {profile.adminProfile?.department && <p><span className="text-white/40">Department:</span> {profile.adminProfile.department}</p>}
          {profile.refereeProfile?.certification && <p><span className="text-white/40">Certification:</span> {profile.refereeProfile.certification}</p>}
          {profile.refereeProfile?.experienceYears !== null && profile.refereeProfile?.experienceYears !== undefined && (
            <p><span className="text-white/40">Experience:</span> {profile.refereeProfile.experienceYears} years</p>
          )}
        </div>
      </section>

      {(profile.role === "ADMIN" || profile.role === "SUPER_ADMIN") && (
        <section className="rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-white">
            Permissions
          </h2>
          {profile.permissions.length === 0 ? (
            <p className="text-sm text-white/50">No permissions assigned yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profile.permissions.map((permission) => (
                <div
                  key={permission}
                  className="rounded-xl border border-[#4AEEFF]/20 bg-[#4AEEFF]/10 px-4 py-3 text-sm font-bold text-[#B8F7FF]"
                >
                  {permissionLabel(permission)}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {profile.role === "REFEREE" && (
        <section className="rounded-2xl border border-white/10 bg-[#061D23]/60 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-black uppercase tracking-wider text-white">Assigned Matches</h2>
          {assignedMatches.length === 0 ? (
            <p className="text-sm text-white/50">No matches assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {assignedMatches.map((match) => {
                const tournament = match.tournament || match.group?.tournament;
                const category = match.category || match.group?.category;
                return (
                  <div key={match.id} className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.05] sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-white">{tournament?.name || "Tournament"}</p>
                      <p className="text-xs text-white/50">{category?.name || "Category"} {match.round ? `• ${match.round}` : ""}</p>
                    </div>
                    <div className="text-left text-xs text-white/60 sm:text-right">
                      <p className="font-bold text-[#4AEEFF]">{match.status}</p>
                      <p>{new Date(match.scheduledTime).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>,
  );
};

export default UserDetails;
