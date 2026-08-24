import styles from "./SectionLabel.module.css";

type Props = {
  num: string;
  text: string;
  light?: boolean;
};

export default function SectionLabel({ num, text, light }: Props) {
  return (
    <div className={`${styles.label} ${light ? styles.light : ""}`}>
      <span className={styles.num}>{num}</span>
      <span className={styles.sep}>/</span>
      <span className={styles.txt}>{text}</span>
    </div>
  );
}
