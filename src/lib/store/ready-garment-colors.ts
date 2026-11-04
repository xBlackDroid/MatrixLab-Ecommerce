/** Mobile naming adapter over production's closed color lists (shirts, hoodies and caps). */
import { DEFAULT_READY_WEAR_COLOR, getDefaultReadyWearColor, getReadyWearColors, isReadyWearGarmentHandle, parseReadyWearColorFor, readyWearColorImage, readyWearColorImages, type ReadyWearColor } from "./ready-wear-colors";
export type ReadyGarmentColor = ReadyWearColor;
export const readyGarmentColors = getReadyWearColors;
export const hasReadyGarmentColorPreviews = isReadyWearGarmentHandle;
export const parseReadyGarmentColor = parseReadyWearColorFor;
export const readyGarmentColorImage = readyWearColorImage;
export const readyGarmentColorImages = readyWearColorImages;
export function defaultReadyGarmentColor(handle: string): ReadyGarmentColor { return getDefaultReadyWearColor(handle) ?? DEFAULT_READY_WEAR_COLOR; }
export function readyGarmentColorSlug(handle: string, color: ReadyGarmentColor): string { return getReadyWearColors(handle).find(option => option.label === color)?.slug ?? color.trim().toLowerCase().replace(/\s+/g, "-"); }
