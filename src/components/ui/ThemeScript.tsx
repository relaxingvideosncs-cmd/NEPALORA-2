export function ThemeScript() {
  const code = `
    (function () {
      try {
        var stored = localStorage.getItem('nepalora-theme');
        var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
