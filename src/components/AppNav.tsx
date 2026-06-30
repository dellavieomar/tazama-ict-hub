"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function AppNav({ showSignOut = false }: { showSignOut?: boolean }) {
  const { signOut } = useAuth();

  return (
    <nav className="app-nav">
      <Link href="/dashboard" className="nav-wordmark-link">
        <span className="nav-wordmark">
          TAZAMA<span className="nav-wordmark-dot">·</span>ICT
        </span>
      </Link>

      <div className="app-nav-right">
        <Link href="/dashboard" className="app-nav-link">Dashboard</Link>
        <Link href="/activities" className="app-nav-link">Activities</Link>
        <Link href="/incidents" className="app-nav-link">Incidents</Link>
        <Link href="/reports" className="app-nav-link">Reports</Link>
        {showSignOut && (
          <button onClick={() => signOut()} className="signout-btn">
            <LogOut size={15} /> Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
