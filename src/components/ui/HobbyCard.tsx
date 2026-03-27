import type { Hobby } from "@/data/site-config";
import { isDev } from "@/lib/utils";

export default function HobbyCard({ hobby }: { hobby: Hobby }) {
  const isHidden = isDev && hobby.visible === false;

  return (
    <div
      className={`bg-surface border rounded-xl p-5 relative ${
        isHidden ? "border-dashed border-amber-500/60 opacity-60" : "border-border"
      }`}
    >
      {isHidden && (
        <span className="absolute top-2 right-2 z-10 bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded">
          DRAFT
        </span>
      )}
      <h3 className="text-lg font-bold mb-2.5 text-text-primary">{hobby.hobby}</h3>
      <p className="text-text-muted text-sm leading-[1.7]">{hobby.description}</p>
      {hobby.accomplishments.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mt-4">
          {hobby.accomplishments.map((a) => (
            <div
              key={a.title}
              className="pl-3.5 py-2.5 pr-3.5 border-l-2 border-accent bg-surface-2 rounded-r-lg"
            >
              <p className="font-semibold text-sm text-text-primary">{a.title}</p>
              {a.img && (
                <img
                  src={a.img}
                  alt={a.title}
                  className="w-full rounded-lg mt-2 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
