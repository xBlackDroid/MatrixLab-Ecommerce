import { Box, CupSoda, GraduationCap, Shirt, Sticker, Zap } from "lucide-react";
import type { MobileFamilyId } from "@/lib/store/mobile-families";
import styles from "./BrandWordmark.module.css";

const icons = { tumbler: CupSoda, stickers: Sticker, wear: Shirt, "3d": Box, laser: Zap, escolar: GraduationCap };

/** Short family name and its symbol; the global header already carries MatrixLab. */
export default function BrandWordmark({ family, label, compact = false, pageHeading = false }: { family: MobileFamilyId; label: string; compact?: boolean; pageHeading?: boolean }) {
  const Icon = icons[family];
  return <span className={`${styles.wordmark} ${compact ? styles.compact : styles.display} ${pageHeading ? styles.page : ""}`} data-brand-wordmark={family}>
    <Icon className={styles.symbol} strokeWidth={1.65} aria-hidden />
    <span className={styles.name}>{label}</span>
  </span>;
}
