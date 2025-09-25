import { MAX_SAFE_INT } from "./constants";

/**
 * Computes a bitwise NOT of the given run-length encoded bitmaps.
 *
 * @param {number[]} bitmap A run-length encoded bitmap array, see {@link bitwiseOR}.
 * @return {number[]} A new bitmap array representing the bitwise NOT of the given bitmap array.
 */
const bitwiseNOT = bitmap => {
  if (!bitmap.length) {
    return [0, MAX_SAFE_INT]; // All ones, up to `MAX_SAFE_INT`.
  }
  const resultBitmap = [];
  let totalNumberOfBits = 0;
  let i = 0;
  if (bitmap[0] > 0) {
    // There are initial leftmost zeros.
    resultBitmap.push(0); // This allows starting with ones.
  } else {
    // There are initial leftmost ones.
    i = 1; // Start with zeros.
  }
  for (; i < bitmap.length; i++) {
    const numberOfBits = bitmap[i];
    totalNumberOfBits += numberOfBits;
    resultBitmap.push(numberOfBits);
  }
  const remainingRightmostOnes = MAX_SAFE_INT - totalNumberOfBits;
  if ((resultBitmap.length - 1) % 2 === 1) {
    resultBitmap[resultBitmap.length - 1] += remainingRightmostOnes;
  } else {
    resultBitmap.push(remainingRightmostOnes);
  }
  return resultBitmap;
};
export default bitwiseNOT;
