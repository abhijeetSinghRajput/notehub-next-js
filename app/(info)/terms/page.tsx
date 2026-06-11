"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "description", title: "What NoteHub Is" },
  { id: "accounts", title: "Your Account" },
  { id: "content", title: "Content You Share" },
  { id: "conduct", title: "Acceptable Use" },
  { id: "ip", title: "Intellectual Property" },
  { id: "termination", title: "Termination" },
  { id: "disclaimer", title: "Disclaimer" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsOfService() {
  const [active, setActive] = useState("acceptance");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        {
          rootMargin: "-30% 0px -60% 0px", // triggers when section is in upper-middle of viewport
          threshold: 0,
        },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    setActive(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary" className="text-xs font-mono">
              Legal
            </Badge>
            <span className="text-xs text-muted-foreground">
              Last updated: June 2025
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            These terms govern your use of NoteHub — a student-built platform
            for sharing notes, blogs, and resources. Please read them carefully.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC — sticky */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-18">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              On this page
            </p>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                    active === s.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-12">
            <Section
              id="acceptance"
              title="Acceptance of Terms"
              onVisible={setActive}
            >
              <p>
                By accessing or using NoteHub (
                <span className="font-medium">notehub-official.vercel.app</span>
                ), you agree to be bound by these Terms of Service. If you do
                not agree, please do not use the platform.
              </p>
              <p>
                These terms apply to all visitors, registered users, authors,
                and contributors — regardless of how you access NoteHub, whether
                through a browser, API, or any third-party integration.
              </p>
            </Section>

            <Separator />

            <Section
              id="description"
              title="What NoteHub Is"
              onVisible={setActive}
            >
              <p>
                NoteHub is an open, student-led platform where learners can
                publish and discover notes, articles, and educational resources
                across topics like Machine Learning, Data Structures &
                Algorithms, Data Science, and Computer Science fundamentals.
              </p>
              <p>
                NoteHub is not a substitute for official academic material.
                Content on NoteHub is created by contributors and does not
                represent any university, institution, or organisation.
              </p>
            </Section>

            <Separator />

            <Section id="accounts" title="Your Account" onVisible={setActive}>
              <p>
                To publish content, you must create an account. You are
                responsible for maintaining the confidentiality of your
                credentials and for all activity that occurs under your account.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>You must be at least 13 years old to create an account.</li>
                <li>
                  You may not create accounts for others without their consent.
                </li>
                <li>
                  You must provide accurate information during registration.
                </li>
                <li>
                  Notify us immediately if you suspect unauthorised access to
                  your account.
                </li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these terms or are used for fraudulent purposes.
              </p>
            </Section>

            <Separator />

            <Section
              id="content"
              title="Content You Share"
              onVisible={setActive}
            >
              <p>
                When you publish notes or blog posts on NoteHub, you retain
                ownership of your content. By posting, you grant NoteHub a
                non-exclusive, royalty-free licence to display, distribute, and
                promote your content within the platform.
              </p>
              <p>You are solely responsible for ensuring your content:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>
                  Does not infringe any third-party copyright, trademark, or
                  intellectual property rights.
                </li>
                <li>
                  Is not copied verbatim from textbooks, papers, or other
                  sources without proper attribution.
                </li>
                <li>Is accurate to the best of your knowledge.</li>
                <li>
                  Does not contain spam, malware, or misleading information.
                </li>
              </ul>
              <p>
                NoteHub may remove content that violates these guidelines
                without prior notice.
              </p>
            </Section>

            <Separator />

            <Section id="conduct" title="Acceptable Use" onVisible={setActive}>
              <p>You agree not to use NoteHub to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Harass, threaten, or intimidate other users.</li>
                <li>Post hateful, discriminatory, or abusive content.</li>
                <li>
                  Scrape or harvest user data without explicit permission.
                </li>
                <li>
                  Attempt to gain unauthorised access to any part of the
                  platform.
                </li>
                <li>
                  Use automated bots to spam, flood, or manipulate content
                  visibility.
                </li>
                <li>
                  Impersonate another person or misrepresent your affiliation.
                </li>
              </ul>
              <p>
                Violations may result in immediate account termination and,
                where applicable, reporting to relevant authorities.
              </p>
            </Section>

            <Separator />

            <Section
              id="ip"
              title="Intellectual Property"
              onVisible={setActive}
            >
              <p>
                The NoteHub name, logo, interface design, and underlying code
                are the intellectual property of NoteHub and its contributors.
                You may not reproduce, distribute, or create derivative works
                from any part of the platform without written permission.
              </p>
              <p>
                Open-source components used in NoteHub remain subject to their
                respective licences. NoteHub's source code, where publicly
                available on GitHub, is licensed separately — refer to the
                repository for details.
              </p>
            </Section>

            <Separator />

            <Section id="termination" title="Termination" onVisible={setActive}>
              <p>
                You may delete your account at any time from your profile
                settings. Upon deletion, your published content may be retained
                in anonymised or archived form to preserve the integrity of
                collections and references made by other users, unless you
                explicitly request full removal.
              </p>
              <p>
                NoteHub reserves the right to suspend or permanently terminate
                accounts that violate these terms, with or without notice.
              </p>
            </Section>

            <Separator />

            <Section id="disclaimer" title="Disclaimer" onVisible={setActive}>
              <p>
                NoteHub is provided <span className="font-medium">"as is"</span>{" "}
                without warranties of any kind. We do not guarantee the
                accuracy, completeness, or reliability of any content on the
                platform.
              </p>
              <p>
                NoteHub is not liable for any direct, indirect, or consequential
                damages arising from your use of the platform, including but not
                limited to academic outcomes, data loss, or service
                interruptions.
              </p>
            </Section>

            <Separator />

            <Section
              id="changes"
              title="Changes to Terms"
              onVisible={setActive}
            >
              <p>
                We may update these terms from time to time. When we do, we'll
                update the "Last updated" date at the top of this page.
                Continued use of NoteHub after changes are posted constitutes
                your acceptance of the revised terms.
              </p>
              <p>
                For significant changes, we'll notify registered users via email
                or an in-app notice.
              </p>
            </Section>

            <Separator />

            <Section id="contact" title="Contact" onVisible={setActive}>
              <p className="leading-7 text-muted-foreground">
                If you have questions about these terms, reach out to us at{" "}
                <a
                  href="mailto:abhijeet62008@gmail.com"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-4 transition-opacity"
                >
                  abhijeet62008@gmail.com
                  <ExternalLink className="size-3.5" />
                </a>{" "}
                or visit our{" "}
                <Link
                  href="https://notehub-official.vercel.app/contact"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-4 transition-opacity"
                >
                  Contact Us Page
                  <ExternalLink className="size-3.5" />
                </Link>
                .
              </p>
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onVisible?: (id: string) => void;
}

function Section({ id, title, children, onVisible }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-lg font-semibold mb-4 text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_p]:text-muted-foreground [&_a]:text-primary">
        {children}
      </div>
    </section>
  );
}
