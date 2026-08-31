// Drop <ThemeScript /> as the FIRST thing in <body> in app/layout.tsx.
// It runs before paint, so there's no flash of the wrong theme —
// no next-themes package needed, just ~10 lines of inline JS.

export function ThemeScript() {
  const code = `
    (function () {
      try {
        var stored = localStorage.getItem('nepalora-theme');
        var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'dark') document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
