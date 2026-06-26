"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const stack = stackRef.current;
    if (!hero || !stack) return;

    const handleMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      stack.style.setProperty("--ry", `${10 + x * 14}deg`);
      stack.style.setProperty("--rx", `${-6 - y * 8}deg`);
    };
    const handleLeave = () => {
      stack.style.setProperty("--ry", `10deg`);
      stack.style.setProperty("--rx", `-6deg`);
    };

    hero.addEventListener("mousemove", handleMove);
    hero.addEventListener("mouseleave", handleLeave);
    return () => {
      hero.removeEventListener("mousemove", handleMove);
      hero.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll(".feature-card");
    if (!cards) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="page">
      <div className="mesh-bg" aria-hidden="true">
        <div className="blob blob-teal" />
        <div className="blob blob-amber" />
        <div className="blob blob-deep" />
      </div>

      <nav className="nav">
        <Image src="/logo.png" alt="TAZAMA" width={150} height={64} className="nav-logo" priority />
        <Link href="/sign-in" className="nav-link">
          Sign in
        </Link>
      </nav>

      <section className="hero" ref={heroRef}>
        <div className="hero-copy">
          <p className="eyebrow">
            TAZAMA EMPTY CONTAINER DEPOT — ICT OPERATIONS HUB
          </p>
          <h1 className="headline">
            Every system, logged
            <br />
            <span className="headline-accent">while you work the floor.</span>
          </h1>
          <p className="subhead">
            Network activity, security events, and backups captured as they
            happen — turned into the report your manager actually reads.
          </p>
          <div className="cta-row">
            <Link href="/sign-up" className="btn-primary">
              Create account
            </Link>
            <Link href="/sign-in" className="btn-ghost">
              Sign in →
            </Link>
          </div>
        </div>

        <div className="stack-wrap">
          <div className="stack" ref={stackRef}>
            <div className="stack-layer layer-3">
              <span className="layer-label">INSIGHTS</span>
              <span className="layer-meta">Risk flags · trends</span>
            </div>
            <div className="stack-layer layer-2">
              <span className="layer-label">REPORTS</span>
              <span className="layer-meta">Weekly · incident · backup</span>
            </div>
            <div className="stack-layer layer-1">
              <span className="layer-label">ACTIVITIES</span>
              <span className="layer-meta">Logged in real time</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features" ref={cardsRef}>
        <div className="feature-card">
          <span className="feature-tag">CAPTURE</span>
          <h3>Record as it happens</h3>
          <p>
            Daily tasks, incidents, and security events — logged from
            wherever you're standing.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-tag">GENERATE</span>
          <h3>Reports write themselves</h3>
          <p>Your logs become a weekly ICT report, formatted and ready to send.</p>
        </div>
        <div className="feature-card">
          <span className="feature-tag">SURFACE</span>
          <h3>See what needs attention</h3>
          <p>Unresolved incidents and risk patterns surface automatically.</p>
        </div>
      </section>

      <footer className="footer">
        <span>TAZAMA Empty Container Depot · Dar es Salaam</span>
      </footer>
    </main>
  );
}
