"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreHorizontal, FiArrowDown, FiArrowUp } from "react-icons/fi";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface StatCardProps {
  label: string;
  value: string | number;
  change: number; // e.g. 12.4 or -3.2 — shown as "98% VS Last day" style
  changeLabel?: string; // defaults to "VS Last day"
  sparkline: number[]; // e.g. [12, 40, 22, 60, ...]
  rangeMin?: string | number; // e.g. 0 or "0%"
  rangeMax?: string | number; // e.g. 100 or "100%"
  menuItems?: { label: string; onClick: () => void }[];
}

export default function StatCard({
  label,
  value,
  change,
  changeLabel = "VS Last day",
  sparkline,
  rangeMin = 0,
  rangeMax = 100,
  menuItems,
}: StatCardProps) {
  const isPositive = change >= 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const chartData = sparkline.map((v, i) => ({ i, v }));
  // Index of the peak point, to mark it with a dot like the reference image
  const peakIndex = sparkline.indexOf(Math.max(...sparkline));

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <FiMoreHorizontal className="text-sm" />
          </button>
          {menuOpen && menuItems && menuItems.length > 0 && (
            <div className="absolute right-0 top-7 z-10 w-40 rounded-xl border border-neutral-200/80 bg-white p-1 shadow-[0px_4px_12px_-2px_rgba(0,0,0,0.12),0px_0px_0px_1px_rgba(25,28,33,0.06)]">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.onClick();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left text-xs font-medium text-neutral-700 px-2.5 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Value + sparkline row */}
      <div className="flex items-end justify-between gap-3">
        <p className="text-[28px] leading-none font-bold text-neutral-900 tracking-tight">
          {value}
        </p>
        <div className="w-24 h-9 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Line
                type="monotone"
                dataKey="v"
                stroke="#d4d4d4"
                strokeWidth={1.5}
                dot={(props: any) =>
                  props.index === peakIndex ? (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={isPositive ? "#f97316" : "#ef4444"}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <span key={props.index} />
                  )
                }
                activeDot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          {rangeMin} <span className="mx-0.5">-</span> {rangeMax}
        </p>
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
            isPositive ? "text-orange-600" : "text-red-500"
          }`}
        >
          {Math.abs(change)}% {changeLabel}
          {isPositive ? (
            <FiArrowUp className="text-[10px]" />
          ) : (
            <FiArrowDown className="text-[10px]" />
          )}
        </span>
      </div>
    </div>
  );
}