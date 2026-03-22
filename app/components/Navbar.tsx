"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  variant?: "team" | "board";
}

export default function Navbar({ variant = "board" }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">bolt</span>
          <span className="font-manrope font-extrabold text-xl text-gray-900">Sprint Logger</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Task Board
          </Link>
          <Link
            href="/team"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/team"
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Team Members
          </Link>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder={variant === "team" ? "Search members..." : "Search tasks..."}
              className="w-64 px-4 py-2 pl-10 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative">
            <span className="material-symbols-outlined text-gray-600">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <span className="material-symbols-outlined text-gray-600">settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
