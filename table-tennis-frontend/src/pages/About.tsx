import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  MapPinIcon,
  TrophyIcon,
  UserGroupIcon,
  SparklesIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import AboutImageDefault from "../assets/sams_college_AboutUs.png";
import ScrollReveal from "../components/ScrollReveal";
import {
  getAboutContent,
  resolveAboutImageUrl,
  type AboutContent,
} from "../services/about.service";
import { useAuth } from "../context/AuthContext";

const DEFAULT_CONTENT: AboutContent = {
  title: "About Sam's College",
  subtitle: "Where education meets opportunity • Established in Northern Sri Lanka",
  badge1: "Northern Sri Lanka",
  badge2: "4 Academy Hubs",
  heroImage: null,
  heroTagline: "Empowering Youth Through Sport",
  heroBadge: "Official Academy",
  introP1:
    "Sam's College (Pvt) Ltd is a leading table tennis development institution dedicated to empowering individuals and communities through sport. Founded by Mr. Samuel Shanmugam, the College was established to address the need for accessible, professional-standard coaching and structured player development in Northern Sri Lanka.",
  introP2:
    "Through its programmes, Sam's College provides students with the training, guidance and opportunities they need to develop their skills, build confidence and pursue their sporting ambitions.",
  founderQuote:
    "Our mission is not just creating champions on the table, but building character, resilience, and discipline that will empower our students throughout their lives.",
  founderName: "Mr. Samuel Shanmugam",
  founderRole: "Founder & Head Coach",
  moreThanTitle: "More Than a Sports Academy",
  moreThanText:
    "At Sam's College, we view sport as an important part of a well-rounded education. Table tennis helps students develop physical fitness, concentration, confidence, discipline, resilience, teamwork and respect—qualities that contribute to success both on and off the table.",
  storyP1:
    "What began as a vision to create meaningful opportunities for aspiring table tennis players has grown into a trusted institution serving students of all ages and abilities. Established in Jaffna, Sam's College has expanded its presence to Jaffna Town, Chavakachcheri and Kokuvil.",
  storyP2:
    "In 2026, the College extended its services to Kilinochchi through a partnership with the Don Bosco School of Excellence. This collaboration established Sam's College's fourth training centre and made structured table tennis development accessible to an even wider community.",
  storyP3:
    "Our continued growth reflects the trust and support of students, parents, schools and community partners. It also demonstrates our commitment to creating sustainable opportunities for young people through sport and education.",
  programmes: [
    "Professional coaching for beginners, intermediate players and advanced athletes",
    "Structured development in technique, tactics and match strategy",
    "Talent identification and pathways for competitive progression",
    "School partnerships, coaching clinics and community-based programmes",
    "Opportunities to participate in tournaments and development events",
    "A safe, inclusive and supportive environment for every student",
  ],
  activityBook:
    "As part of our broader educational contribution, Sam's College has also developed a pioneering table tennis activity book. This resource encourages students to learn about the sport, reinforce their understanding and remain engaged beyond regular training sessions.",
  teamP1:
    "Sam's College is supported by a dedicated team of qualified coaches and administrative professionals. Our team works collaboratively to uphold professional standards, support student wellbeing and provide each player with the individual guidance required to progress.",
  teamP2:
    "Through their expertise, commitment and encouragement, our staff help students develop not only as athletes but also as confident and responsible individuals.",
  visionP1:
    "Our vision is to become a leading centre for table tennis education and development, providing a clear and sustainable pathway for talented players from Northern Sri Lanka to progress to regional, national and international levels.",
  visionP2:
    "At Sam's College, we do more than teach a sport. We nurture confidence, create opportunities and help build the champions of tomorrow—both on and off the table.",
  trainingCentres: [
    {
      name: "Jaffna Town",
      address: "Little Chuttys Montessori\nNo. 23/2, Brodie Front Lane, Kandy Road, Jaffna",
      tag: "Main Academy Hub",
    },
    {
      name: "Chavakachcheri",
      address: "No. 107, Kachchai Road, Chavakachcheri",
      tag: "Training Hub",
    },
    {
      name: "Kokuvil",
      address: "Kokuvil Community Center\nNo. 58, Pirampady Road, Kokuvil, Jaffna",
      tag: "Community Centre",
    },
    {
      name: "Kilinochchi",
      address: "Don Bosco School of Excellence\nSt. Theresa College Lane, Karadippokku, Kilinochchi",
      tag: "New 2026 Campus",
    },
  ],
};

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl tracking-tight text-left">
    {children}
  </h2>
);

const About: React.FC = () => {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const { user } = useAuth();
  const isAdminUser =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.isSuperAdmin;

  useEffect(() => {
    getAboutContent()
      .then((data) => {
        if (data) setContent(data);
      })
      .catch(() => {
        // Fall back gracefully to bundled default content
      });
  }, []);

  const posterImageSrc = content.heroImage
    ? resolveAboutImageUrl(content.heroImage)
    : AboutImageDefault;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-white">
      {/* ─── BG.PNG FIXED FULL-BLEED BACKGROUND ─── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg1.png')" }}
      />
      <div className="fixed inset-0 bg-[#061D23]/25" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

      {/* Floating Admin Quick-Edit Button */}
      {isAdminUser && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Link
            to="/app/admin/about"
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#4AEEFF] hover:bg-[#35efff] text-[#061D23] font-bold text-xs shadow-[0_10px_25px_rgba(74,238,255,0.4)] transition-all hover:scale-105 active:scale-95"
            title="Edit this page as Admin"
          >
            <PencilSquareIcon className="w-4 h-4 text-[#061D23]" />
            <span>Edit About Page</span>
          </Link>
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col space-y-6 px-3.5 sm:px-6 lg:px-10 xl:px-14 py-6 sm:py-8">
        {/* ─── COMPACT GLASS HEADER MODULE ─── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-white/20 bg-[#061D23]/20 p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-heading font-bold text-white tracking-tight leading-tight">
              {content.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/70">
              {content.subtitle}
            </p>
          </div>

          {/* Milestone Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 shrink-0">
            {content.badge1 && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 font-semibold text-white/90">
                {content.badge1}
              </span>
            )}
            {content.badge2 && (
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 font-semibold text-white/90">
                {content.badge2}
              </span>
            )}
          </div>
        </header>

        {/* ─── OVERVIEW & POSTER SECTION (Scroll Animated) ─── */}
        <ScrollReveal delay={100}>
          <section className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Premium Image Frame */}
            <div className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-white/20 bg-[#061D23]/40 p-2 sm:p-3 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.6)] backdrop-blur-xl transition-all duration-300 hover:border-[#4AEEFF]/50">
              <div className="relative w-full overflow-hidden rounded-xl">
                <img
                  src={posterImageSrc}
                  alt="Sam's College table tennis community and admissions"
                  className="block h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>
              {/* Overlay badge with micro-animation */}
              <div className="mt-3 flex items-center justify-between w-full px-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-white/80 font-medium">
                  <SparklesIcon className="w-3.5 h-3.5 text-[#4AEEFF] animate-pulse" />
                  <span>{content.heroTagline}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#4AEEFF] bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 px-2 py-0.5 rounded-md animate-gentle-float">
                  {content.heroBadge}
                </span>
              </div>
            </div>

            {/* Text Details Column */}
            <div className="space-y-4 sm:space-y-5 flex flex-col justify-between">
              <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-6 md:p-7">
                <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed sm:leading-7 text-slate-200">
                  <p className="text-left sm:text-justify leading-relaxed sm:leading-7">
                    {content.introP1}
                  </p>
                  <p className="text-left sm:text-justify leading-relaxed sm:leading-7">
                    {content.introP2}
                  </p>
                </div>
              </article>

              {/* Founder Spotlight Quote Card */}
              <article className="rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/40 p-4 sm:p-5 text-white shadow-[0_20px_50px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <span className="text-3xl text-[#4AEEFF] font-serif leading-none select-none">“</span>
                  <div className="flex-1 text-left">
                    <p className="italic text-xs sm:text-sm md:text-base leading-relaxed text-slate-100 font-medium text-left sm:text-justify">
                      {content.founderQuote}
                    </p>
                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4AEEFF] to-[#12679E] p-0.5 shadow-sm flex items-center justify-center font-bold text-white text-xs">
                        SS
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {content.founderName}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-[#4AEEFF] font-medium leading-tight">
                          {content.founderRole}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-6 md:p-7 text-left">
                <h2 className="text-lg font-bold text-white sm:text-xl text-left">
                  {content.moreThanTitle}
                </h2>
                <p className="mt-2.5 text-sm sm:text-base leading-relaxed sm:leading-7 text-slate-200 text-left sm:text-justify">
                  {content.moreThanText}
                </p>
              </article>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── OUR STORY (Scroll Animated) ─── */}
        <ScrollReveal delay={120}>
          <section className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
            <SectionHeading>Our Story</SectionHeading>
            <div className="mt-3.5 sm:mt-5 space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed sm:leading-7 text-left sm:text-justify text-slate-200">
              <p>{content.storyP1}</p>
              <p>{content.storyP2}</p>
              <p>{content.storyP3}</p>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── PROGRAMMES (Scroll Animated) ─── */}
        <ScrollReveal delay={140}>
          <section className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 py-7 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:py-10">
            <SectionHeading>Our programmes offer:</SectionHeading>
            <ul className="mt-5 sm:mt-6 grid gap-3 sm:gap-4 md:grid-cols-2">
              {content.programmes.map((programme, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl"
                >
                  <CheckCircleIcon
                    className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-[#4AEEFF]"
                    aria-hidden="true"
                  />
                  <span className="text-sm sm:text-base leading-relaxed sm:leading-6 text-slate-200 text-left">
                    {programme}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        {/* ─── ACTIVITY BOOK ASIDE (Scroll Animated) ─── */}
        <ScrollReveal delay={150}>
          <aside className="flex items-center gap-4 sm:gap-5 rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
            <BookOpenIcon
              className="hidden h-9 w-9 shrink-0 text-[#4AEEFF] sm:block"
              aria-hidden="true"
            />
            <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-left sm:text-justify text-slate-100">
              {content.activityBook}
            </p>
          </aside>
        </ScrollReveal>

        {/* ─── TEAM & VISION (Scroll Animated) ─── */}
        <ScrollReveal delay={160}>
          <section className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
            <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
              <div className="mb-4 sm:mb-5 flex items-center gap-3">
                <UserGroupIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[#4AEEFF]" aria-hidden="true" />
                <SectionHeading>Our Team</SectionHeading>
              </div>
              <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed sm:leading-7 text-left sm:text-justify text-slate-200">
                <p>{content.teamP1}</p>
                <p>{content.teamP2}</p>
              </div>
            </article>
            <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-7 md:p-8">
              <div className="mb-4 sm:mb-5 flex items-center gap-3">
                <TrophyIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[#4AEEFF]" aria-hidden="true" />
                <SectionHeading>Our Vision</SectionHeading>
              </div>
              <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed sm:leading-7 text-left sm:text-justify text-slate-200">
                <p>{content.visionP1}</p>
                <p>{content.visionP2}</p>
              </div>
            </article>
          </section>
        </ScrollReveal>

        {/* ─── TRAINING CENTRES (Scroll Animated) ─── */}
        <ScrollReveal delay={180}>
          <section className="pt-4 pb-12 sm:pb-16">
            <div className="mb-6 sm:mb-8 flex items-center gap-3">
              <AcademicCapIcon className="h-8 w-8 sm:h-9 sm:w-9 text-[#4AEEFF]" aria-hidden="true" />
              <SectionHeading>Our Training Centres</SectionHeading>
            </div>
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {content.trainingCentres.map((centre, idx) => (
                <a
                  key={idx}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${centre.name}, ${centre.address.replace(/\n/g, ", ")}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${centre.name} in Google Maps`}
                  className="group relative block rounded-[16px] border border-white/20 bg-[#061D23]/25 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#4AEEFF]/60 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4AEEFF] sm:p-6 text-left"
                >
                  <div className="flex items-center justify-between mb-4">
                    <MapPinIcon className="h-7 w-7 text-[#4AEEFF]" aria-hidden="true" />
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10 group-hover:border-[#4AEEFF]/40 group-hover:text-[#4AEEFF] transition-colors">
                      {centre.tag}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white transition-colors text-left">
                    <span className="group-hover:text-[#4AEEFF]">{centre.name}</span>
                  </h3>
                  <p className="mt-2.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-white/70 text-left">
                    {centre.address}
                  </p>
                </a>
              ))}
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default About;
