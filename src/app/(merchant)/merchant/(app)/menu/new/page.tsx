import { redirect } from "next/navigation";

/** Add/edit now happens in a bottom sheet on the menu screen. */
export default function NewMenuItemPage() {
  redirect("/merchant/menu");
}
