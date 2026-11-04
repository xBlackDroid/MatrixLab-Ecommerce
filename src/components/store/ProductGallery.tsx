"use client";

import { useState } from "react";
import Image from "@/components/store/StoreImage";
import { cn } from "@/lib/utils";
import ProductImagePlaceholder from "@/components/store/ProductImagePlaceholder";

export default function ProductGallery({
  images,
  title,
  brandContext,
}: {
  images: string[];
  title: string;
  brandContext?: string;
}) {
  const [active, setActive] = useState(0);
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="product-gallery-main glass relative aspect-square w-full overflow-hidden rounded-2xl">
        {validImages.length > 0 ? (
          <Image
            brandContext={brandContext}
            src={validImages[Math.min(active, validImages.length - 1)]!}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <ProductImagePlaceholder
            title={title}
            iconClassName="h-24 w-24"
          />
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Imagen ${index + 1}`}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition",
                index === active
                  ? "border-ml-violet"
                  : "border-white/10 opacity-60 hover:opacity-100",
              )}
            >
              <Image
                brandContext={brandContext}
                src={image}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
