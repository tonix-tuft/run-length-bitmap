import bitwiseAND from "./bitwiseAND";
import bitwiseOR from "./bitwiseOR";
import bitwiseNOT from "./bitwiseNOT";

/**
 * @type {Function}
 */
const XOR = (bitmapA, bitmapB) =>
  bitwiseAND(
    bitwiseOR(bitmapA, bitmapB),
    bitwiseOR(bitwiseNOT(bitmapA), bitwiseNOT(bitmapB))
  );

/**
 * Computes a bitwise XOR of the given run-length encoded bitmaps.
 *
 * @param {...number[]} bitmaps A list of run-length encoded bitmap arrays, see {@link bitwiseOR}.
 * @return {number[]} A new bitmap array representing the bitwise XOR of the given bitmap arrays.
 *
 *                    Example:
 *                    `[0, 1, 2, 2]` represents the bitmap `10011`.
 *                    `[2, 2]` represents the bitmap `0011`.
 *
 *                    Then:
 *
 *                    ```
 *                    bitwiseXOR([0, 1, 2, 2], [2, 2]);
 *                    ```
 *
 *                    Would return `[0, 1, 1, 1, 1, 1]` (`10101`).
 *                    This bitmap is effectively the result of the bitwise XOR of the given bitmaps:
 *
 *                    10011
 *                    0011
 *                    -----
 *                    10101
 *
 */
const bitwiseXOR = (...bitmaps) => {
  let resultBitmap;
  if (bitmaps.length <= 0) {
    return [];
  } else if (bitmaps.length === 1) {
    resultBitmap = bitmaps[0];
  } else {
    // There are at least two bitmaps.
    const firstBitmap = bitmaps[0];
    const secondBitmap = bitmaps[1];
    resultBitmap = XOR(firstBitmap, secondBitmap);
    for (let i = 2; i < bitmaps.length; i++) {
      const bitmap = bitmaps[i];
      resultBitmap = XOR(resultBitmap, bitmap);
    }
  }
  if ((resultBitmap.length - 1) % 2 === 0) {
    resultBitmap.pop(); // Pop trailing zeros.
  }
  return resultBitmap;
};
export default bitwiseXOR;
