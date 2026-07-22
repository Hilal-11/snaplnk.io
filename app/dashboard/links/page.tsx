"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  async function fetchLinks() {
    try {
      const res = await fetch("/api/links");

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch links");
      }

      setLinks(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  fetchLinks();
}, []);

  const archiveLink = async (linkId: string) => {
  try {
    const res = await fetch(`/api/links/${linkId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archivedLink: true,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Failed to archive link");
    }

    console.log("Archived successfully:", json);
  } catch (err) {
    console.error(err);
  }
};

const softDeleteLink = async (linkId: string) => {
  try {
    const res = await fetch(`/api/links/${linkId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isDeleted: true,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Failed to delete link");
    }

    console.log("Deleted successfully:", json);
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-neutral-900 mb-6">
        Snaplnk.io Links
      </h1>

      {loading && <p className="text-neutral-500">Loading links...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && links.length === 0 && (
        <p className="text-neutral-500">No links yet.</p>
      )}

      <div className="space-y-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="border border-neutral-200 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">
                /{link.short_code}
              </p>
              <p className="text-sm text-neutral-500 truncate max-w-md">
                {link.original_url}
              </p>
            </div>
            <div className="text-sm text-neutral-500">
              {link.clicks_count ?? 0} clicks
            </div>
            <button onClick={() => archiveLink(link.id)}>
              Archive
            </button>
            <button onClick={() => softDeleteLink(link.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}