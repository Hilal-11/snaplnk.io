import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy · Snaplnk",
  description: "What Snaplnk collects, why, and how long we keep it.",
};

const UPDATED = "November 14, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{title}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-neutral-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="relative isolate min-h-screen bg-neutral-50 px-5 py-16 font-sans">
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-grid mask-fade-radial" />
      <article className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 sm:p-10">
        <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
          ← Snaplnk
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">Privacy policy</h1>
        <p className="mt-1 text-sm text-neutral-400">Last updated {UPDATED}</p>

        <Section title="The short version">
          <p>
            Snaplnk is free. We don&apos;t sell data, show ads or use third-party trackers. We collect only what we need
            to run the service and understand how it&apos;s used.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            When you sign up we store your email address, display name, and the sign-in method you used (email and
            password, Google or GitHub). Passwords are handled by our authentication provider, Supabase, and are never
            visible to us.
          </p>
        </Section>

        <Section title="Content you create">
          <p>
            Short links, QR codes, tags and bio pages you create are stored so they can work. Published bio pages are
            public by design. You can export or delete everything from Settings at any time.
          </p>
        </Section>

        <Section title="Product analytics (first-party)">
          <p>
            To improve Snaplnk we record anonymous usage events such as page views, links created and errors. We store
            the page path, referring site, approximate country and city (from our hosting provider&apos;s network
            data), device type, browser and operating system.
          </p>
          <p>
            <strong className="text-neutral-800">We never store IP addresses.</strong> IPs are turned into a salted hash
            whose salt changes every day, so they can&apos;t be reversed or linked across days. A random ID in your
            browser&apos;s local storage groups events from the same browser; it contains no personal information.
          </p>
          <p>
            If your browser sends <em>Do Not Track</em> or <em>Global Privacy Control</em>, no analytics are recorded.
            You can also opt out from the privacy notice. Raw events are kept for 90 days, then reduced to daily totals.
          </p>
        </Section>

        <Section title="Link clicks">
          <p>
            When someone opens a short link, we record the time, referring site, approximate location, device, browser
            and operating system so the link&apos;s owner can see analytics. Visitor IP addresses are not stored; a keyed
            hash is used to count unique visitors.
          </p>
        </Section>

        <Section title="Cookies and storage">
          <p>
            We use cookies only to keep you signed in (and, for administrators, a security cookie for the admin area).
            Analytics use local storage, not third-party cookies.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can update your profile, export your data, or permanently delete your account in{" "}
            <Link href="/dashboard/settings" className="font-semibold text-neutral-900 underline underline-offset-2">
              Settings
            </Link>
            . Deleting your account removes your links, QR codes, bio pages and analytics.
          </p>
        </Section>
      </article>
    </main>
  );
}
