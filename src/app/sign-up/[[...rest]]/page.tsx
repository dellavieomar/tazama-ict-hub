"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useEffect, useState } from "react";

const capabilities = [
  "Log daily activities & incidents",
  "Track network and security events",
  "Record backups and verify status",
  "Get AI-generated weekly reports",
];

export default function SignUpPage() {
  const [checked, setChecked] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setChecked((c) => (c < capabilities.length ? c + 1 : c));
    }, 450);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="auth-page auth-amber">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-amber" />
        <div className="blob blob-deep" />
      </div>

      <div className="auth-shell">
        <div className="auth-console">
          <p className="eyebrow">PROVISIONING ACCESS</p>
          <h2 className="console-title">Set up your operator account.</h2>
          <ul className="checklist">
            {capabilities.map((item, i) => (
              <li key={item} className={`check-item ${i < checked ? "done" : ""}`}>
                <span className="check-mark">{i < checked ? "✓" : ""}</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-card">
          <SignUp
            fallbackRedirectUrl="/dashboard"
            signInUrl="/sign-in"
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: "#ff6b35",
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
