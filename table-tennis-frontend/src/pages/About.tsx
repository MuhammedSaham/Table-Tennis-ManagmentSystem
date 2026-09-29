import React from "react";
import {
  AcademicCapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  MapPinIcon,
  TrophyIcon,
  UserGroupIcon,
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
  { name: "Jaffna Town", address: "Little Chuttys Montessori\nNo. 23/2, Brodie Front Lane, Kandy Road, Jaffna" },
  { name: "Chavakachcheri", address: "No. 107, Kachchai Road, Chavakachcheri" },
  { name: "Kokuvil", address: "Kokuvil Community Center\nNo. 58, Pirampady Road, Kokuvil, Jaffna" },
  { name: "Kilinochchi", address: "Don Bosco School of Excellence\nSt. Theresa College Lane, Karadippokku, Kilinochchi" },
];

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl font-bold text-white sm:text-3xl">{children}</h2>
);

const About: React.FC = () => (
  <div className="relative min-h-screen w-full overflow-hidden bg-[#061D23] text-slate-700">
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg1.png')" }}
    />
    <div className="fixed inset-0 bg-[#061D23]/25" />
    <div className="fixed inset-0 bg-gradient-to-b from-[#061D23]/20 via-transparent to-[#061D23]/35" />

    <div className="relative z-10">
    <section className="rounded-[16px] border border-white/20 bg-[#061D23]/15 px-4 pb-10 pt-8 text-center text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">About Sam&apos;s College</h1>
        <p className="mt-5 text-xl font-semibold text-[#4AEEFF] sm:text-2xl">Where Education Meets Opportunity</p>
      </div>
    </section>

    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <section className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex min-h-0 items-stretch justify-center overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200">
          <img src={AboutImage} alt="Sam's College table tennis community" className="block h-auto w-full max-w-[30rem] object-contain lg:h-full lg:w-auto lg:max-w-full" />
        </div>

        <div className="space-y-6 sm:space-y-8">
          <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:p-9">
            <div className="space-y-4 sm:space-y-5 text-sm sm:text-base md:text-lg leading-relaxed sm:leading-8 text-slate-200 text-left">
              <p>Sam&apos;s College (Pvt) Ltd is a leading table tennis development institution dedicated to empowering individuals and communities through sport. Founded by Mr. Samuel Shanmugam, the College was established to address the need for accessible, professional-standard coaching and structured player development in Northern Sri Lanka.</p>
              <p>Through its programmes, Sam&apos;s College provides students with the training, guidance and opportunities they need to develop their skills, build confidence and pursue their sporting ambitions.</p>
            </div>
          </article>
          <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:p-9">
            <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">More Than a Sports Academy</h2>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed sm:leading-8 text-slate-200 text-left">At Sam&apos;s College, we view sport as an important part of a well-rounded education. Table tennis helps students develop physical fitness, concentration, confidence, discipline, resilience, teamwork and respect—qualities that contribute to success both on and off the table.</p>
          </article>
        </div>
      </section>

      <section className="my-8 sm:my-10 rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:p-9">
        <SectionHeading>Our Story</SectionHeading>
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed sm:leading-8 text-left text-slate-200">
          <p>What began as a vision to create meaningful opportunities for aspiring table tennis players has grown into a trusted institution serving students of all ages and abilities. Established in Jaffna, Sam&apos;s College has expanded its presence to Jaffna Town, Chavakachcheri and Kokuvil.</p>
          <p>In 2026, the College extended its services to Kilinochchi through a partnership with the Don Bosco School of Excellence. This collaboration established Sam&apos;s College&apos;s fourth training centre and made structured table tennis development accessible to an even wider community.</p>
          <p>Our continued growth reflects the trust and support of students, parents, schools and community partners. It also demonstrates our commitment to creating sustainable opportunities for young people through sport and education.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 py-8 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:py-12 sm:px-9">
        <SectionHeading>Our programmes offer:</SectionHeading>
        <ul className="mt-6 sm:mt-8 grid gap-4 md:grid-cols-2">
          {programmes.map((programme) => (
            <li key={programme} className="flex items-start gap-3 rounded-2xl border border-white/20 bg-[#061D23]/25 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-[#4AEEFF]" aria-hidden="true" />
              <span className="text-sm sm:text-base leading-relaxed sm:leading-7 text-slate-200 text-left">{programme}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="my-10 sm:my-16 flex items-center gap-4 sm:gap-5 rounded-2xl border border-[#4AEEFF]/40 border-l-4 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:p-9">
        <BookOpenIcon className="hidden h-9 w-9 shrink-0 text-[#4AEEFF] sm:block" aria-hidden="true" />
        <p className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed sm:leading-8 text-left text-slate-100">As part of our broader educational contribution, Sam&apos;s College has also developed a pioneering table tennis activity book. This resource encourages students to learn about the sport, reinforce their understanding and remain engaged beyond regular training sessions.</p>
      </aside>

      <section className="grid gap-6 sm:gap-8 py-4 lg:grid-cols-2 lg:gap-12">
        <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:p-9">
          <div className="mb-4 sm:mb-5 flex items-center gap-3"><UserGroupIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[#4AEEFF]" aria-hidden="true" /><SectionHeading>Our Team</SectionHeading></div>
          <div className="space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed sm:leading-8 text-left text-slate-200">
            <p>Sam&apos;s College is supported by a dedicated team of qualified coaches and administrative professionals. Our team works collaboratively to uphold professional standards, support student wellbeing and provide each player with the individual guidance required to progress.</p>
            <p>Through their expertise, commitment and encouragement, our staff help students develop not only as athletes but also as confident and responsible individuals.</p>
          </div>
        </article>
        <article className="rounded-2xl border border-white/20 bg-[#061D23]/35 p-5 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl sm:p-8 md:p-9">
          <div className="mb-4 sm:mb-5 flex items-center gap-3"><TrophyIcon className="h-7 w-7 sm:h-8 sm:w-8 text-[#4AEEFF]" aria-hidden="true" /><SectionHeading>Our Vision</SectionHeading></div>
          <div className="space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed sm:leading-8 text-left text-slate-200">
            <p>Our vision is to become a leading centre for table tennis education and development, providing a clear and sustainable pathway for talented players from Northern Sri Lanka to progress to regional, national and international levels.</p>
            <p>At Sam&apos;s College, we do more than teach a sport. We nurture confidence, create opportunities and help build the champions of tomorrow—both on and off the table.</p>
          </div>
        </article>
      </section>

      <section className="py-16">
        <div className="mb-8 flex items-center gap-3"><AcademicCapIcon className="h-9 w-9 text-[#12679E]" aria-hidden="true" /><SectionHeading>Our Training Centres</SectionHeading></div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {trainingCentres.map((centre) => (
            <article key={centre.name} className="rounded-[16px] border border-white/20 bg-[#061D23]/15 p-6 text-white shadow-[0_25px_60px_-15px_rgba(6,29,35,0.5)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:shadow-xl">
              <MapPinIcon className="h-8 w-8 text-[#12679E]" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-bold text-white">{centre.name}</h3>
              <p className="mt-3 whitespace-pre-line leading-7 text-white/70">{centre.address}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
    </div>
  </div>
);

export default About;