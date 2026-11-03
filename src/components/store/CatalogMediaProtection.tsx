"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Discourages casual copying; browser menus and external clients can bypass it. */
export default function CatalogMediaProtection() {
  const pathname = usePathname();
  const enabled = pathname === "/" || pathname === "/tienda" ||
    pathname.startsWith("/tienda/") || pathname === "/preview/marcas-de-agua";

  useEffect(() => {
    if (!enabled) return;

    function editing(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
      ));
    }

    function contextMenu(event: MouseEvent) {
      if (!editing(event.target)) event.preventDefault();
    }

    function keyboard(event: KeyboardEvent) {
      // Preserve form editing, copy/paste, selection and ordinary navigation.
      const key = event.key.toLowerCase();
      const inspect = key === "f12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        (event.metaKey && event.altKey && ["i", "j", "c"].includes(key));
      if (inspect) { event.preventDefault(); return; }
      if (editing(event.target)) return;
      const sourceOrSave = (event.ctrlKey || event.metaKey) && !event.altKey &&
        !event.shiftKey && ["u", "s"].includes(key);
      if (sourceOrSave) event.preventDefault();
    }

    function drag(event: DragEvent) {
      if (event.target instanceof Element && event.target.closest("img")) event.preventDefault();
    }

    document.addEventListener("contextmenu", contextMenu, true);
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("dragstart", drag, true);
    return () => {
      document.removeEventListener("contextmenu", contextMenu, true);
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("dragstart", drag, true);
    };
  }, [enabled]);

  return null;
}
