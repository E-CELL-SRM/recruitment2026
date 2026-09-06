import { ArrowRight, Zap } from "lucide-react";
import { DomainAnnouncementContent } from "@/lib/announcements";
import styles from "./ThemedAnnouncementCards.module.css";

interface CardProps {
  content: DomainAnnouncementContent;
}

export function CyberpunkCard({ content }: CardProps) {
  return (
    <div className={styles.cyberWrap}>
      <div className={styles.cyberGrid} />
      <div className={styles.cyberScan} />
      <span className={`${styles.cyberCorner} ${styles.cornerTl}`} />
      <span className={`${styles.cyberCorner} ${styles.cornerTr}`} />
      <span className={`${styles.cyberCorner} ${styles.cornerBl}`} />
      <span className={`${styles.cyberCorner} ${styles.cornerBr}`} />

      <span className={styles.cyberTag}>
        <Zap size={11} /> SYSTEM_BROADCAST // TECHNICAL
      </span>
      <h2 className={styles.cyberTitle} data-text={content.heading}>
        {content.heading}
      </h2>
      <p className={styles.cyberMsg}>{content.message}</p>
      <a href={content.link ?? undefined} target="_blank" rel="noopener noreferrer" className={styles.cyberBtn}>
        <span>&gt; {content.ctaLabel}</span>
        <ArrowRight size={14} />
      </a>
    </div>
  );
}

export function ComicCard({ content }: CardProps) {
  return (
    <div className={styles.comicWrap}>
      <div className={styles.comicHalftone} />
      <span className={styles.comicBurst}>
        <span className={styles.comicBurstStarA} />
        <span className={styles.comicBurstStarB} />
        <span className={styles.comicBurstText}>NEW!</span>
      </span>
      <h2 className={styles.comicTitle}>{content.heading}</h2>
      <p className={styles.comicMsg}>{content.message}</p>
      <a href={content.link ?? undefined} target="_blank" rel="noopener noreferrer" className={styles.comicBtn}>
        {content.ctaLabel}
      </a>
    </div>
  );
}

export function OfficeCard({ content }: CardProps) {
  return (
    <div className={styles.officeWrap}>
      <div className={styles.officeStain} />
      <span className={styles.officeStamp}>URGENT</span>
      <div className={styles.officeMemoHeader}>
        <span>TO: All Corporate Staff</span>
        <span>FROM: Management</span>
      </div>
      <h2 className={styles.officeTitle}>{content.heading}</h2>
      <p className={styles.officeMsg}>{content.message}</p>
      <a href={content.link ?? undefined} target="_blank" rel="noopener noreferrer" className={styles.officeBtn}>
        {content.ctaLabel}
      </a>
      <p className={styles.officeFooter}>This memo was left on your desk. Please read before EOD.</p>
    </div>
  );
}
