export function Footer() {
  return (
    <footer className="border-t border-hairline mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-4">
        <p className="text-[13px] text-ink-tertiary">
          © {new Date().getFullYear()} Nepalora. All rights reserved.
        </p>
        <div className="flex gap-6 text-[13px] text-ink-secondary">
          <a href="/privacy" className="underline-draw">Privacy</a>
          <a href="/terms" className="underline-draw">Terms</a>
          <a href="/contact" className="underline-draw">Contact</a>
        </div>
      </div>
    </footer>
  );
}
