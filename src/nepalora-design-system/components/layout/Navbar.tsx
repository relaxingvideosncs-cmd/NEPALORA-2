"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/culture", label: "Culture" },
  { href: "/opinion", label: "Opinion" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-50 transition-all duration-300 ease-out
        ${scrolled ? "glass shadow-sm" : "bg-transparent border-b border-transparent"}
      `}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <Link href="/" className="font-display text-[20px] tracking-tight">
          Nepalora
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="underline-draw text-[14px] text-ink-secondary hover:text-ink transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
