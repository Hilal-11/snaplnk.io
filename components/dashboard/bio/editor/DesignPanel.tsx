"use client";

import { FiAlertTriangle, FiCheck } from "react-icons/fi";
import { THEME_PRESETS } from "@/lib/bio/templates";
import { BIO_FONT_IDS, BIO_FONT_LABELS, type BioFontId } from "@/lib/bio/fonts";
import { getThemeContrastIssues, themeSchema, type ThemeInput } from "@/lib/bio/theme";
import { stableStringify } from "@/lib/bio/snapshot";
import { Field, inputCls } from "./BlockList";

type Props = { theme: ThemeInput; onChange: (theme: ThemeInput, coalesce?: boolean) => void };

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-neutral-900">{title}</p>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 w-fit">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === o.value ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.1)]" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Swatch + hex input. Keeps an existing alpha suffix (#rrggbbaa) when picking a new colour. */
function ColorField({
  label,
  value,
  onChange,
  allowAlpha,
}: {
  label: string;
  value: string;
  onChange: (v: string, coalesce: boolean) => void;
  allowAlpha?: boolean;
}) {
  const base = value.slice(0, 7);
  const alpha = allowAlpha && value.length === 9 ? value.slice(7) : "";
  const valid = allowAlpha ? /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value) : HEX6.test(value);
  return (
    <Field label={label}>
      <div className={`flex items-center gap-2 rounded-lg border bg-neutral-50 px-2 py-1.5 ${valid ? "border-neutral-200" : "border-orange-400"}`}>
        <input
          type="color"
          value={HEX6.test(base) ? base : "#000000"}
          onChange={(e) => onChange(e.target.value + alpha, true)}
          aria-label={`${label} picker`}
          className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-neutral-200 bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.trim(), true)}
          maxLength={allowAlpha ? 9 : 7}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-xs uppercase text-neutral-800 outline-none"
          aria-label={`${label} hex`}
        />
      </div>
    </Field>
  );
}

export default function DesignPanel({ theme, onChange }: Props) {
  const set = <K extends keyof ThemeInput>(key: K, value: ThemeInput[K], coalesce = false) =>
    onChange({ ...theme, [key]: value }, coalesce);

  const valid = themeSchema.safeParse(theme).success;
  const issues = valid ? getThemeContrastIssues(theme) : [];
  const current = stableStringify(themeSchema.safeParse(theme).data ?? theme);

  return (
    <div className="space-y-5">
      {/* Presets */}
      <Section title="Theme presets">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_PRESETS.map((t) => {
            const parsed = themeSchema.parse(t.theme);
            const active = stableStringify(parsed) === current;
            const bg =
              t.theme.background.type === "solid"
                ? t.theme.background.color
                : `linear-gradient(${t.theme.background.angle}deg, ${t.theme.background.from}, ${t.theme.background.to})`;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(structuredClone(t.theme))}
                aria-pressed={active}
                className={`group relative overflow-hidden rounded-lg border p-2 text-left transition-all hover:-translate-y-0.5 ${
                  active ? "border-brand ring-2 ring-brand/20" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-md px-2" style={{ background: bg }}>
                  <span className="h-1.5 w-10 rounded-full" style={{ background: t.theme.text.color, opacity: 0.85 }} />
                  <span
                    className="h-4 w-full"
                    style={{
                      background: t.theme.button.bg,
                      border: `1px solid ${t.theme.button.border}`,
                      borderRadius: Math.min(t.theme.button.radius, 8),
                    }}
                  />
                </div>
                <span className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-neutral-700">
                  {t.name} {active && <FiCheck className="text-brand" />}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Contrast */}
      <div
        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
          issues.length ? "border-orange-100 bg-orange-50 text-orange-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"
        }`}
        aria-live="polite"
      >
        {issues.length ? <FiAlertTriangle className="mt-0.5 shrink-0" /> : <FiCheck className="mt-0.5 shrink-0" />}
        <div>
          {!valid
            ? "Some colours aren't valid hex values yet."
            : issues.length
              ? (
                <>
                  <p className="font-semibold">Some text may be hard to read (WCAG AA needs 4.5:1):</p>
                  {issues.map((i) => (
                    <p key={i.pair}>
                      {i.pair} — {i.ratio}:1
                    </p>
                  ))}
                </>
              )
              : "Readable: all text passes WCAG AA contrast."}
        </div>
      </div>

      {/* Background */}
      <Section title="Background">
        <Segmented
          label="Background type"
          value={theme.background.type}
          options={[
            { value: "solid", label: "Solid" },
            { value: "gradient", label: "Gradient" },
          ]}
          onChange={(type) => {
            const b = theme.background;
            const first = b.type === "solid" ? b.color : b.from;
            set(
              "background",
              type === "solid"
                ? { type: "solid", color: first }
                : { type: "gradient", from: first, to: b.type === "gradient" ? b.to : "#1e1038", angle: b.type === "gradient" ? b.angle : 180 }
            );
          }}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {theme.background.type === "solid" ? (
            <ColorField label="Colour" value={theme.background.color} onChange={(color, c) => set("background", { type: "solid", color }, c)} />
          ) : (
            <>
              <ColorField
                label="From"
                value={theme.background.from}
                onChange={(from, c) => theme.background.type === "gradient" && set("background", { ...theme.background, from }, c)}
              />
              <ColorField
                label="To"
                value={theme.background.to}
                onChange={(to, c) => theme.background.type === "gradient" && set("background", { ...theme.background, to }, c)}
              />
              <Field label="Angle" count={`${theme.background.angle}°`}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={theme.background.angle}
                  onChange={(e) =>
                    theme.background.type === "gradient" && set("background", { ...theme.background, angle: Number(e.target.value) }, true)
                  }
                  className="mt-3 w-full accent-[var(--brand)]"
                />
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* Text */}
      <Section title="Text">
        <div className="grid gap-3 sm:grid-cols-3">
          <ColorField label="Text" value={theme.text.color} onChange={(color, c) => set("text", { ...theme.text, color }, c)} />
          <ColorField label="Muted" value={theme.text.muted} onChange={(muted, c) => set("text", { ...theme.text, muted }, c)} />
          <ColorField label="Accent" value={theme.text.accent} onChange={(accent, c) => set("text", { ...theme.text, accent }, c)} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["heading", "body"] as const).map((k) => (
            <Field key={k} label={k === "heading" ? "Heading font" : "Body font"}>
              <select
                value={theme.font[k]}
                onChange={(e) => set("font", { ...theme.font, [k]: e.target.value as BioFontId })}
                className={inputCls}
              >
                {BIO_FONT_IDS.map((f) => (
                  <option key={f} value={f}>
                    {BIO_FONT_LABELS[f]}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <Segmented
          label="Button style"
          value={theme.button.style}
          options={[
            { value: "fill", label: "Fill" },
            { value: "outline", label: "Outline" },
            { value: "soft", label: "Soft" },
            { value: "shadow", label: "Shadow" },
          ]}
          onChange={(style) => set("button", { ...theme.button, style })}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ColorField label="Fill" allowAlpha value={theme.button.bg} onChange={(bg, c) => set("button", { ...theme.button, bg }, c)} />
          <ColorField label="Label" value={theme.button.fg} onChange={(fg, c) => set("button", { ...theme.button, fg }, c)} />
          <ColorField label="Border" allowAlpha value={theme.button.border} onChange={(border, c) => set("button", { ...theme.button, border }, c)} />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Field label="Corner radius" count={theme.button.radius >= 999 ? "Pill" : `${theme.button.radius}px`}>
            <input
              type="range"
              min={0}
              max={32}
              value={Math.min(theme.button.radius, 32)}
              onChange={(e) => set("button", { ...theme.button, radius: Number(e.target.value) }, true)}
              className="mt-2 w-48 accent-[var(--brand)]"
            />
          </Field>
          <button
            type="button"
            onClick={() => set("button", { ...theme.button, radius: theme.button.radius >= 999 ? 12 : 999 })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              theme.button.radius >= 999 ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"
            }`}
          >
            Pill
          </button>
        </div>
      </Section>

      {/* Layout */}
      <Section title="Layout">
        <Field label="Style">
          <Segmented
            label="Layout style"
            value={theme.layout.variant ?? "classic"}
            options={[
              { value: "card", label: "Card" },
              { value: "cover", label: "Cover" },
              { value: "classic", label: "Classic" },
            ]}
            onChange={(variant) => set("layout", { ...theme.layout, variant })}
          />
        </Field>
        <p className="mt-1.5 mb-4 text-[11px] text-neutral-400">
          Card: profile card + icon link rows · Cover: banner, big avatar and contact rows · Classic: centred buttons.
        </p>
        {theme.layout.variant === "cover" && (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <ColorField label="Cover banner" value={theme.cover ?? "#e9dcc8"} onChange={(cover, c) => set("cover", cover, c)} />
          </div>
        )}
        <div className="flex flex-wrap gap-5">
          <Field label="Avatar">
            <Segmented
              label="Avatar shape"
              value={theme.avatar.shape}
              options={[
                { value: "circle", label: "Circle" },
                { value: "rounded", label: "Rounded" },
                { value: "square", label: "Square" },
              ]}
              onChange={(shape) => set("avatar", { shape })}
            />
          </Field>
          <Field label="Width">
            <Segmented
              label="Content width"
              value={theme.layout.width}
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "normal", label: "Normal" },
                { value: "wide", label: "Wide" },
              ]}
              onChange={(width) => set("layout", { ...theme.layout, width })}
            />
          </Field>
          <Field label="Spacing">
            <Segmented
              label="Spacing"
              value={theme.layout.spacing}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfy" },
                { value: "airy", label: "Airy" },
              ]}
              onChange={(spacing) => set("layout", { ...theme.layout, spacing })}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}
