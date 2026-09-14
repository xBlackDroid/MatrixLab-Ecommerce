import ProductPhotoGallery from "./ProductPhotoGallery";
import { MATRIXLAB_3D_PLACEHOLDER_IMAGE } from "@/lib/store/matrixlab-3d";

/** Mantiene la misma galería 3D, compartida ahora con los vasos listos. */
export default function ThreeDProductGallery(props: { images: readonly string[]; title: string }) {
  return <ProductPhotoGallery {...props} placeholder={MATRIXLAB_3D_PLACEHOLDER_IMAGE} />;
}
