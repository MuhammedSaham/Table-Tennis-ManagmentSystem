import React, { useState } from "react";
import {
  AcademicCapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  MapPinIcon,
  TrophyIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import AboutImage from "../assets/sams_college_AboutUs.png";

const programmes = [
  "Professional coaching for beginners, intermediate players and advanced athletes",
  "Structured development in technique, tactics and match strategy",
  "Talent identification and pathways for competitive progression",
  "School partnerships, coaching clinics and community-based programmes",
  "Opportunities to participate in tournaments and development events",
  "A safe, inclusive and supportive environment for every student",
];

const trainingCentres = [
  { name: "Jaffna Town", address: "Little Chuttys Montessori\nNo. 23/2, Brodie Front Lane, Kandy Road, Jaffna", tag: "Main Academy Hub" },
  { name: "Chavakachcheri", address: "No. 107, Kachchai Road, Chavakachcheri", tag: "Training Hub" },
  { name: "Kokuvil", address: "Kokuvil Community Center\nNo. 58, Pirampady Road, Kokuvil, Jaffna", tag: "Community Centre" },
  { name: "Kilinochchi", address: "Don Bosco School of Excellence\nSt. Theresa College Lane, Karadippokku, Kilinochchi", tag: "New 2026 Campus" },
];

const getMapEmbedUrl = (address: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address.replace(/\n/g, ", "))}&output=embed`;

const getMapUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/\n/g, ", "))}`;

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">{children}</h2>
);

const About: React.FC = () => {
  const [selectedCentre, setSelectedCentre] = useState<(typeof trainingCentres)[number] | null>(null);

  return (
  <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
    {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg1.png')" }}
    />
    <div className="fixed inset-0 bg-[#061D23]/25" />
    <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-6 px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* ─── HEADER MODULE (Unified with Players & Leaderboard) ─── */}
      <header className="flex flex-col justify-between gap-3 rounded-[16px] border border-white/20 bg-[#061D23]/15 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 sm:mb-3 h-[3px] w-12 sm:w-16 bg-[#4AEEFF]" />
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40 align-middle mb-1.5">
            Academy Profile
          </span>
          <h1 className="text-2xl font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white sm:text-4xl">
            About Sam&apos;s College
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[#4AEEFF]/90">
            Where Education Meets Opportunity • Established in Northern Sri Lanka
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#061D23]/40 px-4 py-2.5 sm:px-5 sm:py-3 text-left sm:text-right shrink-0">
          <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/30 mb-1">
            Northern Sri Lanka
          </span>
          <p className="text-xs sm:text-sm font-bold text-white">4 Training Hubs</p>
        </div>
      </header>

      {/* ─── OVERVIEW & POSTER SECTION ─── */}
      <section className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Premium Image Frame */}
        <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-[#061D23]/40 p-2 sm:p-3 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl transition-all duration-300 hover:border-[#4AEEFF]/50">
          <div className="relative w-full overflow-hidden rounded-xl">
            <img
              src={AboutImage}
              alt="Sam's College table tennis community and admissions"
              className="block h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
          {/* Overlay badge */}
          <div className="mt-2.5 flex items-center justify-between w-full px-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-white/80 font-medium">
              <SparklesIcon className="w-3.5 h-3.5 text-[#4AEEFF]" />
              <span>Empowering Youth Through Sport</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#4AEEFF] bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 px-2 py-0.5 rounded-md">
              Official Academy
            </span>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5 flex flex-col justify-between">
          <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-6 md:p-7">
            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed sm:leading-8 text-slate-200 text-left">
              <p>Sam&apos;s College (Pvt) Ltd is a leading table tennis development institution dedicated to empowering individuals and communities through sport. Founded by Mr. Samuel Shanmugam, the College was established to address the need for accessible, professional-standard coaching and structured player development in Northern Sri Lanka.</p>
              <p>Through its programmes, Sam&apos;s College provides students with the training, guidance and opportunities they need to develop their skills, build confidence and pursue their sporting ambitions.</p>
            </div>
          </article>

          {/* Founder Spotlight Quote Card */}
          <article className="rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/40 p-4 sm:p-5 text-white shadow-[0_20px_50px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <span className="text-3xl text-[#4AEEFF] font-serif leading-none select-none">“</span>
              <div>
                <p className="italic text-xs sm:text-sm md:text-base leading-relaxed text-slate-100 font-medium">
                  Our mission is not just creating champions on the table, but building character, resilience, and discipline that will empower our students throughout their lives.
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4AEEFF] to-[#12679E] p-0.5 shadow-sm flex items-center justify-center font-bold text-white text-xs">
                    SS
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Mr. Samuel Shanmugam</h4>
                    <p className="text-[10px] sm:text-xs text-[#4AEEFF] font-medium">Founder & Head Coach</p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-6 md:p-7">
            <h2 className="text-lg font-bold text-white sm:text-xl">More Than a Sports Academy</h2>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed sm:leading-8 text-slate-200 text-left">At Sam&apos;s College, we view sport as an important part of a well-rounded education. Table tennis helps students develop physical fitness, concentration, confidence, discipline, resilience, teamwork and respect—qualities that contribute to success both on and off the table.</p>
          </article>
        </div>
      </section>

      {/* ─── OUR STORY ─── */}
      <section className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
        <SectionHeading>Our Story</SectionHeading>
        <div className="mt-3.5 sm:mt-5 space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed sm:leading-8 text-left text-slate-200">
          <p>What began as a vision to create meaningful opportunities for aspiring table tennis players has grown into a trusted institution serving students of all ages and abilities. Established in Jaffna, Sam&apos;s College has expanded its presence to Jaffna Town, Chavakachcheri and Kokuvil.</p>
          <p>In 2026, the College extended its services to Kilinochchi through a partnership with the Don Bosco School of Excellence. This collaboration established Sam&apos;s College&apos;s fourth training centre and made structured table tennis development accessible to an even wider community.</p>
          <p>Our continued growth reflects the trust and support of students, parents, schools and community partners. It also demonstrates our commitment to creating sustainable opportunities for young people through sport and education.</p>
        </div>
      </section>

      {/* ─── PROGRAMMES ─── */}
      <section className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 py-7 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:py-10">
        <SectionHeading>Our programmes offer:</SectionHeading>
        <ul className="mt-5 sm:mt-6 grid gap-3 sm:gap-4 md:grid-cols-2">
          {programmes.map((programme) => (
            <li key={programme} className="flex items-start gap-3 rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-[#4AEEFF]" aria-hidden="true" />
              <span className="text-sm sm:text-base leading-relaxed sm:leading-7 text-slate-200 text-left">{programme}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── ACTIVITY BOOK ASIDE ─── */}
      <aside className="flex items-center gap-4 sm:gap-5 rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
        <BookOpenIcon className="hidden h-9 w-9 shrink-0 text-[#4AEEFF] sm:block" aria-hidden="true" />
        <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed sm:leading-8 text-left text-slate-100">As part of our broader educational contribution, Sam&apos;s College has also developed a pioneering table tennis activity book. This resource encourages students to learn about the sport, reinforce their understanding and remain engaged beyond regular training sessions.</p>
      </aside>

      {/* ─── TEAM & VISION ─── */}
      <section className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
        <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
          <div className="mb-4 sm:mb-5 flex items-center gap-3"><UserGroupIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[#4AEEFF]" aria-hidden="true" /><SectionHeading>Our Team</SectionHeading></div>
          <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed sm:leading-8 text-left text-slate-200">
            <p>Sam&apos;s College is supported by a dedicated team of qualified coaches and administrative professionals. Our team works collaboratively to uphold professional standards, support student wellbeing and provide each player with the individual guidance required to progress.</p>
            <p>Through their expertise, commitment and encouragement, our staff help students develop not only as athletes but also as confident and responsible individuals.</p>
          </div>
        </article>
        <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
          <div className="mb-4 sm:mb-5 flex items-center gap-3"><TrophyIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[#4AEEFF]" aria-hidden="true" /><SectionHeading>Our Vision</SectionHeading></div>
          <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed sm:leading-8 text-left text-slate-200">
            <p>Our vision is to become a leading centre for table tennis education and development, providing a clear and sustainable pathway for talented players from Northern Sri Lanka to progress to regional, national and international levels.</p>
            <p>At Sam&apos;s College, we do more than teach a sport. We nurture confidence, create opportunities and help build the champions of tomorrow—both on and off the table.</p>
          </div>
        </article>
      </section>

      {/* ─── TRAINING CENTRES ─── */}
      <section className="pt-4 pb-12 sm:pb-16">
        <div className="mb-6 sm:mb-8 flex items-center gap-3">
          <AcademicCapIcon className="h-8 w-8 sm:h-9 sm:w-9 text-[#4AEEFF]" aria-hidden="true" />
          <SectionHeading>Our Training Centres</SectionHeading>
        </div>
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {trainingCentres.map((centre) => (
            <article
              key={centre.name}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCentre(centre)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedCentre(centre);
                }
              }}
              aria-pressed={selectedCentre?.name === centre.name}
              className="group relative cursor-pointer rounded-[16px] border border-white/20 bg-[#061D23]/25 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#4AEEFF]/60 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4AEEFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061D23] sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <MapPinIcon className="h-7 w-7 text-[#4AEEFF]" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10 group-hover:border-[#4AEEFF]/40 group-hover:text-[#4AEEFF] transition-colors">
                  {centre.tag}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#4AEEFF] transition-colors">{centre.name}</h3>
              <p className="mt-2.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-white/70">{centre.address}</p>
            </article>
          ))}
        </div>

        {selectedCentre && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#4AEEFF]/40 bg-[#061D23]/40 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#4AEEFF]">Selected location</p>
                <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{selectedCentre.name}</h3>
                <p className="mt-1 text-xs text-white/60">{selectedCentre.address.replace(/\n/g, ", ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={getMapUrl(selectedCentre.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-[#4AEEFF] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#061D23] transition hover:bg-white"
                >
                  Live location
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCentre(null)}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/80 transition hover:border-[#4AEEFF]/60 hover:text-[#4AEEFF]"
                >
                  Close map
                </button>
              </div>
            </div>
            <iframe
              title={`${selectedCentre.name} map`}
              src={getMapEmbedUrl(selectedCentre.address)}
              className="h-72 w-full border-0 sm:h-96"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </section>
    </div>
  </div>
  );
};

export default About;