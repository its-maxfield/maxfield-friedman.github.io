import type { Hobby } from "@/data/site-config";

export default function HobbyCard({ hobby }: { hobby: Hobby }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
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
