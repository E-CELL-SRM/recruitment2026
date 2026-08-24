"use client";

import { useEffect, useRef } from "react";
import Image, { type ImageProps } from "next/image";
import { revealClipImage } from "@/lib/animations/reveals";
import styles from "./RevealImage.module.css";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectPosition?: string;
} & Pick<ImageProps, "fill">;

export default function RevealImage({
  src,
  alt,
  className = "",
  sizes = "100vw",
  priority,
  objectPosition,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapRef.current && imgRef.current) {
      revealClipImage(wrapRef.current, imgRef.current);
    }
  }, []);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className}`}>
      <div ref={imgRef} className={styles.inner}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={objectPosition ? { objectPosition } : undefined}
          className={styles.img}
        />
      </div>
    </div>
  );
}
