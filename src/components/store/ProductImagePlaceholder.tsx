import {
  Box,
  Magnet,
  Shirt,
  Sparkles,
  Sticker,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_BY_KEYWORD: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /sticker/i, icon: Sticker },
  { test: /iman/i, icon: Magnet },
  { test: /playera|tote|prenda/i, icon: Shirt },
  { test: /gorra/i, icon: Sparkles },
  { test: /laser|grabado/i, icon: Zap },
  { test: /3d|pieza/i, icon: Box },
];

const GRADIENTS = [
  "from-ml-violet/25 via-ml-bg to-ml-cyan/15",
  "from-ml-cyan/20 via-ml-bg to-ml-violet/20",
  "from-ml-coral/15 via-ml-bg to-ml-violet/20",
];

/** Placeholder de marca cuando el producto aún no tiene fotos. */
export default function ProductImagePlaceholder({
  title,
  className,
  iconClassName,
}: {
  title: string;
  className?: string;
  iconClassName?: string;
}) {
  const match = ICON_BY_KEYWORD.find(({ test }) => test.test(title));
  const Icon = match?.icon ?? Sparkles;
  const gradient =
    GRADIENTS[
      Math.abs(
        title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
      ) % GRADIENTS.length
    ];

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        gradient,
        className,
      )}
    >
      <Icon
        className={cn("h-14 w-14 text-ml-white/30", iconClassName)}
        aria-hidden
      />
    </div>
  );
}
