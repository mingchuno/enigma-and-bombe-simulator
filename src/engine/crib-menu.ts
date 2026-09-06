import { ALPHABET } from "./enigma.ts";

export interface MenuEdge {
  a: number;
  b: number;
  position: number;
}
export interface ScramblerEdge extends MenuEdge {
  mapping: ArrayLike<number>;
}
/** Alignment of normalized text; collision positions are zero-based message indices. */
export function inspectCribAlignment(
  ciphertext: string,
  crib: string,
  offset: number,
) {
  const maximum = Math.max(0, ciphertext.length - crib.length);
  const fits =
    ciphertext.length > 0 &&
    crib.length > 0 &&
    Number.isInteger(offset) &&
    offset >= 0 &&
    offset + crib.length <= ciphertext.length;
  const collisions = [...crib].flatMap((letter, index) =>
    ciphertext[offset + index] === letter ? [offset + index] : [],
  );
  return { maximum, fits, collisions };
}

export function buildMenu(
  ciphertext: string,
  crib: string,
  offset: number,
): MenuEdge[] {
  if (!/^[A-Z]+$/.test(ciphertext) || !/^[A-Z]+$/.test(crib))
    throw new Error("Enter ciphertext and a crib using A–Z.");
  const alignment = inspectCribAlignment(ciphertext, crib, offset);
  if (!alignment.fits) {
    throw new Error("The crib must fit inside the ciphertext at this offset.");
  }
  const firstCollision = alignment.collisions[0];
  if (firstCollision !== undefined) {
    throw new Error(
      `At position ${firstCollision + 1}, ${ciphertext[firstCollision]} would encrypt to itself. Move or change the crib.`,
    );
  }
  return [...crib].map((letter, index) => {
    const position = index + offset;
    return {
      a: ALPHABET.indexOf(letter),
      b: ALPHABET.indexOf(ciphertext[position]),
      position,
    };
  });
}
