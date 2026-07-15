// Storage layout for product images (bucket: "products"):
//   products/{productId}/main-{ts}.{ext}         -> currently displayed image (enhanced or uploaded)
//   products/{productId}/original-{ts}.{ext}      -> pre-enhancement source, kept for reference/revert
//   products/{productId}/additional/{ts}-{r}.{ext} -> gallery images
//
// Keeping everything under a single per-product folder makes it easy to
// find, audit and clean up all assets that belong to one product.

export const PRODUCTS_BUCKET = "products";

export function imageExt(file: { name?: string; type?: string }): string {
  const fromName = file.name?.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  const type = file.type || "";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

export function mainImagePath(productId: string, file: File): string {
  return `${productId}/main-${Date.now()}.${imageExt(file)}`;
}

export function originalImagePath(productId: string, file: File): string {
  return `${productId}/original-${Date.now()}.${imageExt(file)}`;
}

export function additionalImagePath(productId: string, file: File): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${productId}/additional/${Date.now()}-${rand}.${imageExt(file)}`;
}
