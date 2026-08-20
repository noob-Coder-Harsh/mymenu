import { redirect } from "next/navigation";

/** Settings live on the store edit page. */
export default function MerchantSettingsPage() {
  redirect("/merchant/store/edit#settings");
}
