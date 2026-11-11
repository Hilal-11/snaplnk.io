// lib/bio/vcard.ts
import type { BlockOfType } from "./blocks";

function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
}

/** vCard 3.0 for a contact_card block. */
export function buildVCard(card: BlockOfType<"contact_card">): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const name = card.name || card.company || "Contact";
  lines.push(`FN:${esc(name)}`, `N:${esc(name)};;;;`);
  if (card.company) lines.push(`ORG:${esc(card.company)}`);
  if (card.phone) lines.push(`TEL;TYPE=CELL:${esc(card.phone)}`);
  if (card.email) lines.push(`EMAIL:${esc(card.email)}`);
  if (card.website) lines.push(`URL:${esc(card.website)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function vCardDataUri(card: BlockOfType<"contact_card">): string {
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard(card))}`;
}
