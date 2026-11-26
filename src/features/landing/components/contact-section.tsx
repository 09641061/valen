import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./landing-page.module.css";

const fields = [
  { id: "contact-name", label: "Your name", placeholder: "Full name", type: "text" },
  { id: "business-name", label: "Business name", placeholder: "e.g. Studio Cloud", type: "text" },
  { id: "contact-email", label: "Email address", placeholder: "you@example.com", type: "email" },
  { id: "contact-phone", label: "Phone number", placeholder: "+1 202 555 0142", type: "tel" },
];

export function ContactSection() {
  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <div>
        <p className={styles.eyebrow}>Let&apos;s talk</p>
        <h2 id="contact-title">Tell us about your business.</h2>
        <p>Let&apos;s talk about how you organize your appointments and services.</p>
      </div>
      <fieldset className={styles.contactFields} aria-describedby="contact-status">
        <legend className="sr-only">Contact form preview</legend>
        <div className={styles.contactGrid}>
          {fields.map(({ id, label, placeholder, type }) => (
            <div key={id}>
              <Label htmlFor={id}>{label}</Label>
              <Input id={id} type={type} placeholder={placeholder} autoComplete="off" />
            </div>
          ))}
        </div>
        <Button type="button" size="lg" disabled className={styles.cta}>
          Send request
        </Button>
        <p id="contact-status">This preview does not send or save your information.</p>
      </fieldset>
    </section>
  );
}
