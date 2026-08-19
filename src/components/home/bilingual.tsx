export function Bilingual({
  en,
  hi,
  as: Tag = "p",
  className = "",
  enClassName = "",
  hiClassName = "mt-1 block text-[0.92em] font-medium text-muted",
}: {
  en: string;
  hi: string;
  as?: "p" | "h1" | "h2" | "h3" | "span";
  className?: string;
  enClassName?: string;
  hiClassName?: string;
}) {
  return (
    <Tag className={className}>
      <span className={enClassName}>{en}</span>
      <span lang="hi" className={hiClassName}>
        {hi}
      </span>
    </Tag>
  );
}
