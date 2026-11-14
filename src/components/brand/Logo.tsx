type Props = {
  /** "light" for dark backgrounds (sidebar / brand panel), "default" for light surfaces. */
  tone?: "default" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { tile: "h-8 rounded-lg px-1", img: "h-6", text: "text-sm" },
  md: { tile: "h-10 rounded-xl px-1.5", img: "h-7", text: "text-lg" },
  lg: { tile: "h-12 rounded-xl px-2", img: "h-9", text: "text-2xl" },
} as const;

/**
 * IntelliFeed360 wordmark with the Agrovestors mark. The mark sits on a white
 * tile so its greens and greys read on both light and dark surfaces.
 */
export function Logo({ tone = "default", size = "md", className = "" }: Props) {
  const s = SIZES[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`flex shrink-0 items-center bg-white shadow-sm ring-1 ring-black/5 ${s.tile}`}>
        <img src="/agrovestors-logo.png" alt="Agrovestors" className={`${s.img} w-auto`} width={170} height={100} />
      </span>
      <span className={`flex items-baseline font-semibold tracking-tight ${s.text}`}>
        <span className={tone === "light" ? "text-white" : "text-foreground"}>IntelliFeed</span>
        <span className="text-primary">360</span>
      </span>
    </div>
  );
}
