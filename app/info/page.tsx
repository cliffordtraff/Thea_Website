import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import { Figure } from "@/components/Figure";
import { info } from "@/content/info";
import styles from "./info.module.css";

export const metadata: Metadata = { title: "Info + Contact" };

export default function InfoPage() {
  return (
    <SiteFrame active="info">
      <h2 className="sr-only">Info + Contact</h2>
      <div className={styles.wrap}>
        <div className={styles.portrait}>
          <Figure
            image={info.portrait}
            priority
            sizes="(max-width: 768px) 82vw, 34vw"
          />
        </div>

        <div className={styles.bio}>
          {info.bio.map((para, i) => (
            <p key={i} className={styles.para}>
              {para}
            </p>
          ))}

          <address className={styles.contact}>
            <div>
              <span className={styles.label}>Email:</span> {info.contact.email}
            </div>
            <div>
              <span className={styles.label}>Cell:</span> {info.contact.phone}
            </div>
            <div>
              <span className={styles.label}>Instagram:</span>{" "}
              {info.contact.instagram}
            </div>
          </address>

          <div className={styles.list}>
            <p className={styles.listHeading}>Select Clients:</p>
            <ul>
              {info.clients.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className={styles.list}>
            <p className={styles.listHeading}>Interviews:</p>
            <ul>
              {info.interviews.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
