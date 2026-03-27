import SectionWrapper from "@/components/ui/SectionWrapper";
import Hero from "@/components/sections/Hero";
import Blog from "@/components/sections/Blog";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Hobbies from "@/components/sections/Hobbies";
import Contact from "@/components/sections/Contact";
import { siteConfig } from "@/data/site-config";

const isDev = process.env.NODE_ENV === "development";

function SectionVisible({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const visible = siteConfig.sections[id] !== false;
  if (!isDev && !visible) return null;

  return (
    <SectionWrapper id={id} className={className}>
      {isDev && !visible && (
        <div className="mb-4 px-3 py-1.5 bg-amber-500/20 border border-dashed border-amber-500/60 rounded text-amber-400 text-xs font-mono inline-block">
          HIDDEN SECTION
        </div>
      )}
      {children}
    </SectionWrapper>
  );
}

export default function Home() {
  return (
    <>
      <SectionWrapper id="hero" className="pt-24">
        <Hero />
      </SectionWrapper>
      <SectionVisible id="blog">
        <Blog />
      </SectionVisible>
      <SectionVisible id="projects">
        <Projects />
      </SectionVisible>
      <SectionVisible id="experience">
        <Experience />
      </SectionVisible>
      <SectionVisible id="hobbies">
        <Hobbies />
      </SectionVisible>
      <SectionVisible id="contact">
        <Contact />
      </SectionVisible>
    </>
  );
}
