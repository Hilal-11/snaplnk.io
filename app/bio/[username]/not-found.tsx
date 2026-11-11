import Link from "next/link";

export default function BioNotFound() {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-50 px-6 text-center font-sans">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-radial" />
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">This page is offline</h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        It may have been unpublished, renamed, or it never existed.
      </p>
      <Link href="/" className="mt-6 rounded-lg btn-primary px-4 py-2 text-sm font-semibold text-white">
        Create your own on Snaplnk
      </Link>
    </div>
  );
}
