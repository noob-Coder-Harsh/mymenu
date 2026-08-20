import { redirect } from "next/navigation";

/** Edit now happens in a bottom sheet on the menu screen. */
export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  await params;
  redirect("/merchant/menu");
}
