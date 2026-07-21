import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import { Figure } from "@/components/Figure";
import { info } from "@/content/info";
import styles from "./info.module.css";

export const metadata: Metadata = { title: "Info + Contact" };

export default function InfoPage() {
  return (
    <SiteFrame active="info" theme="light">
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
            <p
              key={i}
              className={i === 0 ? styles.para : `${styles.para} ${styles.paraJustify}`}
            >
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
              <a
                href="https://www.instagram.com/theatraff"
                target="_blank"
                rel="noopener noreferrer"
              >
                {info.contact.instagram}
              </a>
            </div>
          </address>

          <div className={styles.columns}>
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
                {info.interviews.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
