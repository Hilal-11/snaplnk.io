// lib/bio/embeds.ts
// Allowlisted embeds only. We never render user HTML: the URL is parsed into a
// provider + id and the iframe src is built from our own template.

export type EmbedProvider = "youtube" | "vimeo" | "spotify" | "soundcloud";

export type ParsedEmbed = {
  provider: EmbedProvider;
  src: string;
  /** CSS aspect-ratio, or a fixed height in px for audio players. */
  aspectRatio?: string;
  height?: number;
};

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseEmbed(input: string): ParsedEmbed | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  // YouTube: watch?v=, youtu.be/<id>, /shorts/<id>, /embed/<id>, /live/<id>
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    let id: string | null = null;
    if (host === "youtu.be") id = parts[0] ?? null;
    else if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) id = parts[1] ?? null;
    if (!id || !YT_ID.test(id)) return null;
    return { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, aspectRatio: "16 / 9" };
  }

  // Vimeo: vimeo.com/<numeric id>, player.vimeo.com/video/<id>
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = host === "player.vimeo.com" ? parts[1] : parts.find((p) => /^\d+$/.test(p));
    if (!id || !/^\d{1,12}$/.test(id)) return null;
    return { provider: "vimeo", src: `https://player.vimeo.com/video/${id}`, aspectRatio: "16 / 9" };
  }

  // Spotify: open.spotify.com/(intl-xx/)?(track|album|playlist|episode|show|artist)/<id>
  if (host === "open.spotify.com") {
    const p = parts[0]?.startsWith("intl-") ? parts.slice(1) : parts;
    const [kind, id] = p;
    if (!kind || !id || !["track", "album", "playlist", "episode", "show", "artist"].includes(kind)) return null;
    if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
    const tall = kind !== "track" && kind !== "episode";
    return { provider: "spotify", src: `https://open.spotify.com/embed/${kind}/${id}`, height: tall ? 352 : 152 };
  }

  // SoundCloud: soundcloud.com/<artist>/<track or sets/...>
  if (host === "soundcloud.com") {
    if (parts.length < 2 || !parts.every((s) => /^[A-Za-z0-9_-]{1,100}$/.test(s))) return null;
    const clean = `https://soundcloud.com/${parts.join("/")}`;
    return {
      provider: "soundcloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&visual=false`,
      height: 166,
    };
  }

  return null;
}
