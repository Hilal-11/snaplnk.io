import BioRenderer, { type BioRendererProps } from "@/components/bio/BioRenderer";

const DEVICE_WIDTH = 390; // logical phone width the page is laid out at

/**
 * Live, scaled-down, non-interactive render of a bio page (no screenshots).
 * `width` is the on-screen width in px; height follows `aspect` (default phone 9:19).
 */
export default function BioPreviewFrame({
  width,
  aspect = 19 / 9,
  className = "",
  ...renderer
}: BioRendererProps & { width: number; aspect?: number; className?: string }) {
  const scale = width / DEVICE_WIDTH;
  const height = Math.round(width * aspect);
  return (
    <div
      aria-hidden
      inert
      className={`relative overflow-hidden select-none ${className}`}
      style={{ width, height }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: DEVICE_WIDTH, minHeight: height / scale, transform: `scale(${scale})` }}
      >
        <BioRenderer mode="preview" showBranding={false} {...renderer} />
      </div>
    </div>
  );
}
