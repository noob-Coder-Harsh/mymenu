export function ComingSoon({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm leading-6 text-muted">{note}</p>
    </section>
  );
}
