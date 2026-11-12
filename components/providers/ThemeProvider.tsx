"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { getReduceMotion, subscribeDevicePrefs } from "@/lib/devicePrefs";

/**
 * shadcn-style theming: next-themes toggles the `.dark` class on <html>
 * ("light" | "dark" | "system"). Motion follows the OS setting, or is always
 * reduced when the user turns on Settings → Appearance → Reduce motion.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const reduce = useSyncExternalStore(subscribeDevicePrefs, getReduceMotion, () => false);

  // Lets globals.css switch off CSS transitions/animations too.
  useEffect(() => {
    if (reduce) document.documentElement.setAttribute("data-reduce-motion", "");
    else document.documentElement.removeAttribute("data-reduce-motion");
  }, [reduce]);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion={reduce ? "always" : "user"}>{children}</MotionConfig>
    </NextThemesProvider>
  );
}
