import { siteConfig } from "@/data/site-config";
import ExperienceCard from "@/components/ui/ExperienceCard";
import { visibleOnly, isDev } from "@/lib/utils";

export default function Experience() {
  const entries = isDev ? siteConfig.experience : visibleOnly(siteConfig.experience);

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Experience</h2>
      <div className="flex flex-col gap-5">
        {entries.map((entry) => (
          <ExperienceCard key={entry.company} entry={entry} />
        ))}
      </div>
    </div>
  );
}
