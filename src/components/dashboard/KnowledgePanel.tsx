import { BookOpen, Beef, Microscope, ClipboardList, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { icon: LucideIcon; title: string; subtitle: string; tag: string };

const items: Item[] = [
  { icon: BookOpen, title: "Latest feeding guidelines", subtitle: "Updated protocols for broilers & layers", tag: "Guideline" },
  { icon: Beef, title: "Species recommendations", subtitle: "Nutritional needs by species & age", tag: "Reference" },
  { icon: Microscope, title: "Research updates", subtitle: "New findings from Agrovestors Lab", tag: "Research" },
  { icon: ClipboardList, title: "Nutritional references", subtitle: "Vitamin & mineral requirement tables", tag: "Reference" },
  { icon: Shield, title: "Disease management protocols", subtitle: "Prevention & response playbooks", tag: "Protocol" },
];

export function KnowledgePanel() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Knowledge & Research</h2>
      <ul className="flex-1 space-y-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li
              key={it.title}
              className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/40 hover:bg-primary-soft/30 transition-colors cursor-pointer"
            >
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-info-soft text-info">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{it.title}</p>
                <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>
              </div>
              <span className="text-[10px] font-medium text-info bg-info-soft px-2 py-1 rounded-full">
                {it.tag}
              </span>
            </li>
          );
        })}
      </ul>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        Open Knowledge Base
      </button>
    </section>
  );
}