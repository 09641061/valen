import Image from "next/image";
import { CalendarDays, ContactRound, LayoutGrid, MessageCircle } from "lucide-react";
import koduWorkspace from "../assets/kodu-workspace.webp";
import { ContactSection } from "./contact-section";
import { FaqSection } from "./faq-section";
import { LandingHeader, LandingLogo, TalkLink } from "./landing-navigation";
import { ProductPreview } from "./product-preview";
import styles from "./landing-page.module.css";

const features = [
  {
    icon: CalendarDays,
    label: "Calendar",
    title: "Organize the day",
    description: "See appointments by time and team member, with changes visible on the calendar.",
  },
  {
    icon: ContactRound,
    label: "CRM",
    title: "Keep client details handy",
    description: "Find clients by name or phone, even before you have a conversation with them.",
  },
  {
    icon: LayoutGrid,
    label: "Catalog",
    title: "Organize your services",
    description: "Group services into categories so your team can find them quickly.",
  },
];

const steps = [
  {
    title: "Set up your business",
    description: "Add your business details, time zone, and opening hours.",
  },
  {
    title: "Organize your services",
    description: "Create categories and assign each service to one of them.",
  },
  {
    title: "Manage your appointments",
    description: "Check your calendar and handle booking requests from WhatsApp or add them manually.",
  },
];

export function LandingPage() {
  return (
    <div id="top" className={styles.page}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <div className={styles.container}>
        <LandingHeader />

        <main id="main-content" tabIndex={-1}>
          <section className={styles.hero} aria-labelledby="landing-title">
            <div className={styles.heroCopy}>
              <p className={styles.heroLabel}>For businesses that work by appointment</p>
              <h1 id="landing-title">Your service business, on schedule.</h1>
              <p className={styles.heroDescription}>
                Takodu brings appointments, services, and clients together for
                small businesses. Booking requests can come in through WhatsApp.
              </p>
              <TalkLink />
              <p className={styles.audience}>
                For salons, barbershops, spas, clinics, and consultancies.
              </p>
            </div>
            <ProductPreview />
          </section>

          <ul className={styles.topics} aria-label="Takodu at a glance">
            {["Calendar", "Clients", "Services", "WhatsApp"].map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>

          <p className={styles.statement}>
            Every appointment in its place.
            <br />
            Every client with context.
          </p>

          <section id="product" className={styles.product} aria-labelledby="product-title">
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.eyebrow}>The essentials, connected</p>
                <h2 id="product-title">Your business, in one view.</h2>
              </div>
              <p>
                Takodu connects your calendar, services, and client details so
                your team can see what&apos;s next and who it&apos;s for.
              </p>
            </div>

            <div className={styles.featureGrid}>
              {features.map(({ icon: Icon, label, title, description }) => (
                <article key={label} className={styles.feature}>
                  <p className={styles.featureLabel}>
                    <Icon aria-hidden="true" />
                    {label}
                  </p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>

            <div className={styles.koduStory}>
              <div className={styles.koduArt}>
                <Image
                  src={koduWorkspace}
                  alt="Kodu organizing appointments beside a calendar and client card."
                  fill
                  sizes="(max-width: 767px) 100vw, 560px"
                  className={styles.koduScene}
                />
                <span>Meet Kodu</span>
              </div>
              <div>
                <p className={styles.eyebrow}>A clear starting point</p>
                <h3>Less time switching between messages, schedules, and records.</h3>
                <p>
                  See the appointment, service, and client record together.
                  Your team can keep client details handy whether the conversation
                  starts on WhatsApp or in person.
                </p>
              </div>
            </div>
          </section>

          <section id="how-it-works" className={styles.workflow} aria-labelledby="workflow-title">
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.eyebrow}>How it works</p>
                <h2 id="workflow-title">From setup to your daily schedule.</h2>
              </div>
              <p>Get your business ready to take and manage bookings.</p>
            </div>

            <ol className={styles.steps}>
              {steps.map(({ title, description }, index) => (
                <li key={title}>
                  <span className={styles.eyebrow} aria-hidden="true">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>

            <div className={styles.channelNote}>
              <MessageCircle aria-hidden="true" />
              <p>
                <strong>WhatsApp is optional.</strong> You can add clients
                manually and keep their records even without a conversation.
              </p>
            </div>
          </section>

          <FaqSection />
          <ContactSection />
        </main>

        <footer className={styles.footer}>
          <LandingLogo />
        </footer>
      </div>
    </div>
  );
}
