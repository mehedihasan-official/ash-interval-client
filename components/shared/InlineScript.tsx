"use client";

// Renders an inline <script> that runs synchronously during HTML parsing
// on the server (so it can set the theme class before first paint),
// but is inert on the client so React 19's hydration warnings don't
// fire.
//
// Marked "use client" so the type-swap actually happens on both sides:
//   • Server render (typeof window === "undefined") → text/javascript.
//     The browser executes it once during HTML parsing.
//   • Client render (typeof window === "object")     → text/plain.
//     React sees a plain-text script — no "scripts inside React
//     components are never executed" warning, no hydration mismatch.
//
// This matches the recipe in
// node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
