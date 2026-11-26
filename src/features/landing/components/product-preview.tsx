import Image from "next/image";
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import koduMascot from "../assets/kodu-mascot.webp";
import styles from "./product-preview.module.css";

const appointments = [
  { time: "09:30", name: "Valeria Soto", detail: "Haircut · WhatsApp", status: "Confirmed" },
  { time: "11:00", name: "Paula Herrera", detail: "Color · Manual", status: "Confirmed" },
  { time: "14:30", name: "Camila Ríos", detail: "Consultation · WhatsApp", status: "Pending" },
  { time: "16:00", name: "Open slot", detail: "Daily schedule" },
];

export function ProductPreview() {
  return (
    <figure className={styles.preview}>
      <figcaption className={styles.caption}>
        <span>Takodu · Product preview</span>
        <Badge variant="outline" className={styles.demoBadge}>Demo data</Badge>
      </figcaption>

      <div className={styles.window}>
        <div className={styles.windowBar}>
          <span className={styles.windowDots} aria-hidden="true" />
          <span>Calendar · Studio Cloud</span>
          <time dateTime="11-24">Tue, Nov 24</time>
        </div>
        <div className={styles.windowBody}>
          <div className={styles.sidebar} aria-hidden="true">
            <b>takodu</b>
            {["Calendar", "Clients", "Services", "Settings"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.schedule}>
            <div className={styles.scheduleHeading}>
              <b>Today, Tuesday 24</b>
              <span>Day view</span>
            </div>
            <ul>
              {appointments.map(({ time, name, detail, status }) => (
                <li key={time}>
                  <time dateTime={time}><Clock3 aria-hidden="true" />{time}</time>
                  <span className={styles.appointment}>
                    <b>{name}</b>
                    <span>{detail}</span>
                  </span>
                  {status && <span className={styles.status}>{status}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Image src={koduMascot} alt="" loading="eager" unoptimized className={styles.mascot} />
    </figure>
  );
}
