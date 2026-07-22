import { customAlphabet } from "nanoid";

// avoids visually ambiguous characters (0/O, 1/l/I) so short codes stay readable
const alphabet =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const nanoid = customAlphabet(alphabet, 7);

export function generateShortCode(): string {
  return nanoid();
}