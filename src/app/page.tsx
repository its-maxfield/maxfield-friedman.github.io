import SectionWrapper from "@/components/ui/SectionWrapper";
import Hero from "@/components/sections/Hero";
import Blog from "@/components/sections/Blog";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Hobbies from "@/components/sections/Hobbies";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <SectionWrapper id="hero" className="pt-24">
        <Hero />
      </SectionWrapper>
      <SectionWrapper id="blog">
        <Blog />
      </SectionWrapper>
      <SectionWrapper id="projects">
        <Projects />
      </SectionWrapper>
      <SectionWrapper id="experience">
        <Experience />
      </SectionWrapper>
      <SectionWrapper id="hobbies">
        <Hobbies />
      </SectionWrapper>
      <SectionWrapper id="contact">
        <Contact />
      </SectionWrapper>
    </>
  );
}
