import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="text-sm text-muted">
        This menu link is invalid, the store is inactive, or this order does not exist.
      </p>
      <Link href="/" className="text-sm font-medium text-accent">
        Go home
      </Link>
    </div>
  );
}
