import { siteConfig } from "@/data/site-config";
import ExperienceCard from "@/components/ui/ExperienceCard";

export default function Experience() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Experience</h2>
      <div className="flex flex-col gap-5">
        {siteConfig.experience.map((entry) => (
          <ExperienceCard key={entry.company} entry={entry} />
        ))}
      </div>
    </div>
  );
}
