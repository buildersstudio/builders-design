/**
 * Ventures that are not public. Their platform pages and their files under /ventures/<slug>/
 * need the unlock password (UNLOCK_PASSWORD on Vercel); one unlock opens all of them.
 * Shared presentation links (/p/...) stay open, like before.
 */
export const PRIVATE_VENTURES = ["trigger", "day-zero", "builders", "cto-festival", "cortena", "avery", "everday", "makimode", "katasaga", "243"];

export const isPrivate = (slug?: string) => !!slug && PRIVATE_VENTURES.includes(slug);

/** The value stored in the unlock cookie: a hash of the password, never the password itself. */
export async function unlockToken(password: string) {
  const data = new TextEncoder().encode(`${password}:builders-design:unlock`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const UNLOCK_COOKIE = "bd_key";
/** readable by the page, only to show or hide lock marks; access itself is checked with bd_key */
export const UNLOCKED_FLAG = "bd_unlocked";
