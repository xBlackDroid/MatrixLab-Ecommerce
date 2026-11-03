"use client";

import Image, { type ImageProps } from "next/image";
import {
  IMAGE_WATERMARK_BRANDS,
  imageWatermarkBrand,
  type ImageWatermarkBrand,
} from "@/lib/store/image-watermark";
import styles from "./StoreImage.module.css";

type StoreImageProps = ImageProps & {
  brand?: ImageWatermarkBrand;
  brandContext?: string;
};

/** Template-only deterrent, not DRM: direct asset URLs remain accessible. */
export default function StoreImage({
  brand,
  brandContext = "",
  className = "",
  onContextMenu,
  onDragStart,
  ...props
}: StoreImageProps) {
  const src = typeof props.src === "string" ? props.src : "src" in props.src ? props.src.src : props.src.default.src;
  const family = brand ?? imageWatermarkBrand(brandContext) ?? imageWatermarkBrand(src) ?? imageWatermarkBrand(props.alt);
  const identity = family ? IMAGE_WATERMARK_BRANDS[family] : undefined;

  return (
    <span
      className={`${styles.frame}${props.fill ? ` ${styles.fill}` : ""}`}
      data-store-image={family ?? "matrixlab"}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <Image
        {...props}
        alt={props.alt}
        className={`${className} ${styles.photo}`}
        draggable={false}
        onContextMenu={(event) => { event.preventDefault(); onContextMenu?.(event); }}
        onDragStart={(event) => { event.preventDefault(); onDragStart?.(event); }}
      />
      <span className={styles.watermark} aria-hidden="true" data-image-watermark={family ?? "matrixlab"}>
        {identity ? (
          <>
            <Image src={identity.logo} alt="" fill={false} width={192} height={192} sizes="192px" className={styles.logo} draggable={false} />
            <Image src={identity.logo} alt="" fill={false} width={96} height={96} sizes="96px" className={styles.signature} draggable={false} />
          </>
        ) : <span className={styles.fallback}>MatrixLab</span>}
        <span className={styles.credit}>matrixlabintelligence.com</span>
      </span>
    </span>
  );
}
