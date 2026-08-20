import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-xl font-bold tracking-tight">Not found</h1>
      <p className="font-script max-w-xs text-[17px] leading-snug text-muted">
        This menu link is invalid, the store is inactive, or this order does not exist.
      </p>
      <Link href="/" className="customer-link mt-1">
        Go home
      </Link>
    </div>
  );
}
