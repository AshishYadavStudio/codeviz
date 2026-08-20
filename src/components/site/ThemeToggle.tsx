"use client";

/**
 * Reads the theme straight off the DOM attribute the bootstrap script set, so
 * there is no React state to hydrate and no wrong-icon flash. Both icons are
 * rendered and CSS picks one — the same mechanism the rest of the theme uses.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("codeviz-theme", next);
    } catch {
      // private browsing — theme still applies for this session
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle light and dark theme"
      className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted transition-colors hover:border-steel hover:text-steel-ink"
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </button>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <path d="M12 8.4A5.2 5.2 0 0 1 5.6 2 5.4 5.4 0 1 0 12 8.4Z" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <circle cx="7" cy="7" r="2.9" />
      <path
        d="M7 .8v1.6M7 11.6v1.6M13.2 7h-1.6M2.4 7H.8M11.4 2.6l-1.1 1.1M3.7 10.3l-1.1 1.1M11.4 11.4l-1.1-1.1M3.7 3.7 2.6 2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
