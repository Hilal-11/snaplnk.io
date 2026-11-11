"use client";

import Link from "next/link";
import { useState } from "react";
import { FiArrowLeft, FiAtSign, FiFileText, FiLink, FiPlus, FiType, FiX } from "react-icons/fi";
import { getBaseUrl } from "@/lib/utils/getShortUrl";
import { FormField } from "@/components/dashboard/links/LinkDialogs";
import BioPhoneMock from "./BioPhoneMock";

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-neutral-400 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-neutral-400";

// UI-only builder: there is no bio_pages table/API yet, so publishing is disabled.
export default function BioPageBuilder() {
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<string[]>(["My portfolio", "Latest project"]);
  const domain = getBaseUrl().replace(/^https?:\/\//, "");

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard/bio-pages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-4"
      >
        <FiArrowLeft size={14} /> Back to bio pages
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Create a bio page</h1>
        <span className="rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          Preview — publishing coming soon
        </span>
        <p className="w-full text-sm text-neutral-500">Design your page and see it live on the right.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] space-y-5">
          <FormField label="Page URL" icon={FiAtSign}>
            <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 focus-within:bg-white focus-within:border-neutral-400 transition-colors">
              <span className="pl-3 text-sm text-neutral-400 whitespace-nowrap">{domain}/bio/</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="yourname"
                className="flex-1 min-w-0 bg-transparent py-2.5 pr-3 text-sm outline-none"
              />
            </div>
          </FormField>
          <FormField label="Display name" icon={FiType}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className={inputCls} />
          </FormField>
          <FormField label="Bio" icon={FiFileText}>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="Tell visitors who you are"
              className={`${inputCls} resize-none`}
            />
          </FormField>
          <FormField label="Links" icon={FiLink}>
            <div className="space-y-2">
              {links.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={l}
                    onChange={(e) => setLinks(links.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder="Link title"
                    className={inputCls}
                  />
                  <button
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    aria-label="Remove link"
                    className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              ))}
              {links.length < 8 && (
                <button
                  onClick={() => setLinks([...links, ""])}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2.5 text-sm font-medium text-neutral-500 hover:border-neutral-500 hover:text-neutral-900"
                >
                  <FiPlus size={14} /> Add link
                </button>
              )}
            </div>
          </FormField>
          <button
            disabled
            className="w-full rounded-lg bg-black text-white text-sm font-semibold py-3 opacity-40 cursor-not-allowed"
          >
            Publish bio page — coming soon
          </button>
        </div>

        <aside className="lg:col-span-2 flex justify-center lg:sticky lg:top-24 self-start">
          <BioPhoneMock name={name || "Your Name"} bio={bio || "Creator · Developer · Builder"} links={links} />
        </aside>
      </div>
    </div>
  );
}
