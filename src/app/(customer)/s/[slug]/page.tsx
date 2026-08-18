import { ComingSoon } from "@/components/coming-soon";

export default async function CustomerMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ComingSoon
      title={slug.replaceAll("-", " ")}
      note="Customer menu, cart, and checkout land in I3. This route is the QR landing page."
    />
  );
}
