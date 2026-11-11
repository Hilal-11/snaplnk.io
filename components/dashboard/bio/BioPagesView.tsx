"use client";

import { useState } from "react";
import { FiUser } from "react-icons/fi";
import { CreateButton, PageTitle, SearchInput, ViewToggle } from "@/components/dashboard/links/CollectionToolbar";
import type { ViewMode } from "@/components/dashboard/links/types";
import BioPhoneMock from "./BioPhoneMock";

// Bio pages have no backend table yet — this view shares the Links/QR toolbar
// so the page is ready to be wired to real data once the table exists.
export default function BioPagesView() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <PageTitle
          title="Bio Pages"
          subtitle="One link in your bio that holds all your links, socials and content."
          count={0}
        />
        <CreateButton href="/dashboard/bio-pages/new" label="Create Bio Page" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search bio pages" />
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 lg:p-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mb-5">
              <FiUser size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
              {search ? "No bio pages match your search" : "You don't have any bio pages yet"}
            </h3>
            <p className="text-sm text-neutral-500 mt-2 max-w-md">
              Build a mobile-first landing page with your links, socials and a profile — then share it
              anywhere with a single short link. Every click is tracked in Analytics.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <CreateButton href="/dashboard/bio-pages/new" label="Create Bio Page" />
            </div>
          </div>
          <div className="flex justify-center">
            <BioPhoneMock />
          </div>
        </div>
      </div>
    </div>
  );
}
