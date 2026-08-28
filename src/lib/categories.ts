import type { ProductCategory } from "@/api/types";

/** The ONLY nine categories the backend accepts. No "Plants". No "Medicines". */
export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "SEEDS", label: "Seeds" },
  { value: "FERTILIZERS", label: "Fertilizers" },
  { value: "PESTICIDES", label: "Crop Protection" },
  { value: "TOOLS_EQUIPMENT", label: "Tools & Equipment" },
  { value: "IRRIGATION", label: "Irrigation" },
  { value: "ANIMAL_FEED", label: "Animal Feed" },
  { value: "ORGANIC", label: "Organic" },
  { value: "MACHINERY", label: "Machinery" },
  { value: "OTHER", label: "Other" },
];

const VALUES = new Set(PRODUCT_CATEGORIES.map((c) => c.value));

/** Validate a URL segment like /marketplace/seeds. */
export function parseCategory(
  slug: string | undefined,
): ProductCategory | null {
  if (!slug) return null;
  const upper = slug.toUpperCase().replace(/-/g, "_");
  return VALUES.has(upper as ProductCategory)
    ? (upper as ProductCategory)
    : null;
}

export const categoryToSlug = (c: ProductCategory) =>
  c.toLowerCase().replace(/_/g, "-");
