"use client";
import { useEffect, useState } from "react";

// Light/dark switch. In light mode we use ESPN's standard logos; in dark mode, their dark-background versions.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => { setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"); }, []);

  useEffect(() => {
    const light = theme === "light";
    const fix = (root: ParentNode | null) => {
      root?.querySelectorAll?.("img[src*=\"/teamlogos/ncaa/\"]").forEach((img) => {
        const s = img.getAttribute("src") || "";
        const n = light ? s.replace("/ncaa/500-dark/", "/ncaa/500/") : s.replace("/ncaa/500/", "/ncaa/500-dark/");
        if (n !== s) img.setAttribute("src", n);
      });
    };
    fix(document);
    const mo = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "attributes") fix((m.target as Element).parentNode);
        m.addedNodes.forEach((n) => { if (n.nodeType === 1) fix((n as Element).tagName === "IMG" ? (n as Element).parentNode : (n as Element)); });
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
    return () => mo.disconnect();
  }, [theme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("tapedog.theme", next); } catch {}
    setTheme(next);
  };

  return (
    <button className="themebtn" onClick={toggle} aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} title={theme === "light" ? "Dark mode" : "Light mode"}>
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      )}
    </button>
  );
}
