import { siteConfig } from "@/data/site-config";
import HobbyCard from "@/components/ui/HobbyCard";
import { visibleOnly, isDev } from "@/lib/utils";

export default function Hobbies() {
  const hobbies = isDev ? siteConfig.hobbies : visibleOnly(siteConfig.hobbies);

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-6">Hobbies</h2>
      <div className="flex flex-col gap-5">
        {hobbies.map((hobby) => (
          <HobbyCard key={hobby.hobby} hobby={hobby} />
        ))}
      </div>
    </div>
  );
}
