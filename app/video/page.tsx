import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import styles from "./video.module.css";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage() {
  return (
    <SiteFrame active="video">
      <h2 className="sr-only">Video</h2>
      <div className={styles.wrap}>
        <video
          className={styles.video}
          src="/brittle.mp4"
          poster="/brittle-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
    </SiteFrame>
  );
}
