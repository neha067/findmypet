/**
 * Default icons for pets based on pet type
 * Returns a special value indicating that an icon should be used instead of an image
 */

export type PetType = "cat" | "dog" | "other";

/**
 * Special value indicating that an icon should be used instead of an image
 */
export const USE_ICON = "__USE_ICON__" as const;

/**
 * Returns a marker indicating that an icon should be used for default pet display
 * @param petType - The type of pet (cat, dog, or other)
 * @returns Special marker value indicating icon should be used
 */
export function getDefaultPetIcon(petType?: PetType | string | null): typeof USE_ICON {
  return USE_ICON;
}

/**
 * Returns a marker indicating that an icon should be used for default social post display
 */
export function getDefaultPostIcon(): typeof USE_ICON {
  return USE_ICON;
}

/**
 * Checks if the given value indicates that an icon should be used
 */
export function shouldUseIcon(value?: string | null): boolean {
  return !value || value === USE_ICON || value.trim().length === 0;
}

/**
 * Gets image URL or icon marker
 * @param imageUrl - The provided image URL (can be empty/null)
 * @param petType - The pet type (for default selection)
 * @returns Image URL if provided, or USE_ICON marker if not
 */
export function getImageUrlOrIcon(imageUrl?: string | null, petType?: PetType | string | null): string | typeof USE_ICON {
  if (imageUrl && imageUrl.trim().length > 0) {
    return imageUrl;
  }
  
  // Return icon marker for default display
  return USE_ICON;
}

