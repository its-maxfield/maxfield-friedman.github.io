import { siteConfig } from "@/data/site-config";
import EducationCard from "@/components/ui/EducationCard";
import { visibleOnly, isDev } from "@/lib/utils";

export default function Education() {
  const entries = isDev ? siteConfig.education : visibleOnly(siteConfig.education);

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Education</h2>
      <div className="flex flex-col gap-5">
        {entries.map((entry) => (
          <EducationCard key={entry.institution} entry={entry} />
        ))}
      </div>
    </div>
  );
}
