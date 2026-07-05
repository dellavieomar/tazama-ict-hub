"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useEffect, useState } from "react";

const statusLines = [
  "Checking network uptime…",
  "Verifying firewall rules…",
  "Backup job: completed 02:14",
  "0 unresolved incidents",
];

export default function SignInPage() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVisibleLines((v) => (v < statusLines.length ? v + 1 : v));
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="auth-page">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-teal" />
        <div className="blob blob-deep" />
      </div>

      <div className="auth-shell">
        <div className="auth-console">
          <p className="eyebrow">SYSTEM STATUS</p>
          <h2 className="console-title">Welcome back to the depot.</h2>
          <div className="console-log">
            {statusLines.map((line, i) => (
              <p key={line} className={`console-line ${i < visibleLines ? "visible" : ""}`}>
                <span className="console-dot" /> {line}
              </p>
            ))}
          </div>
        </div>

        <div className="auth-card">
          <SignIn
            fallbackRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: "#00d4b8",
                borderRadius: "10px",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none bg-transparent",
                card: "shadow-none bg-transparent",
                footer: "bg-transparent",
                footerAction: "bg-transparent",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
