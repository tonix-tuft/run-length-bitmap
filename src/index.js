/*
 * Copyright (c) 2025 Anton Bagdatyev (Tonix)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

import { isObjectEmpty, objectMin, noOpFn } from "js-utl";

/**
 * @type {number}
 */
const MAX_SAFE_INT = 9_007_199_254_740_991; // (2**53) - 1 (i.e. `Number.MAX_SAFE_INTEGER`)

/**
 * @type {Function}
 */
const withBitmapStateMap = ({
  bitmaps,
  onBitmapWithoutSequenceOfBits = noOpFn,
}) => {
  let resultBitmap = [];
  const map = {};
  bitmaps.map((bitmap, index) => {
    const hasAtLeastOneSequenceOfBits = typeof bitmap[0] !== "undefined";
    if (!hasAtLeastOneSequenceOfBits) {
      onBitmapWithoutSequenceOfBits(bitmap, index);
    }
    if (!map[index] && hasAtLeastOneSequenceOfBits) {
      map[index] = {
        i: 0,
        bits: bitmap[0],
      };
    }
  });
  return callback => {
    while (!isObjectEmpty(map)) {
      const result = callback({ map, resultBitmap });
      if (result) {
        resultBitmap = result;
        break;
      }
    }
    if ((resultBitmap.length - 1) % 2 === 0) {
      resultBitmap.pop(); // Pop trailing zeros.
    }
    return resultBitmap;
  };
};

/**
 * Computes a bitwise OR of the given run-length encoded bitmaps.
 *
 * @param {...number[]} bitmaps A list of run-length encoded bitmap arrays, each bitmap being an array of numbers where each number represents the number of zeros and ones
 *                              (in order from left to right, starting from the number of zeros), e.g. `[1, 3, 4]` represents the bitmap `01110000`,
 *                              where the first leftmost 1 bit is zero, followed by 3 ones, followed by 4 zeros.
 *
 * @return {number[]} A new bitmap array representing the bitwise OR of the given bitmaps arrays. The bitwise OR is computed left-to-right.
 *                    An empty array given as a bitmap is considered as an indefinite sequence of zeros, and an empty array is returned
 *                    if all the given bitmap arrays are empty.
 *
 *                    Example:
 *                    `[10, 2]` represents the bitmap `000000000011`, where the first 10 bits are zeros, followed by 2 ones.
 *                    `[15, 1]` represents the bitmap `0000000000000001`, where the first 15 bits are zeros, followed by 1 one.
 *                    `[0, 4, 12, 2]` represents the bitmap `111100000000000011`, where the first 4 bits are ones, followed by 12 zeros, followed by 2 ones.
 *
 *                    Then:
 *
 *                    ```
 *                    bitwiseOR([10, 2], [15, 1], [0, 4, 12, 2]);
 *                    ```
 *
 *                    Would return `[0, 4, 6, 2, 3, 3]` (`111100000011000111`), i.e. a bitmap where the first 4 bits are ones, followed by 6 zeros,
 *                    followed by 2 ones, followed by 3 zeros, followed by 3 ones.
 *                    This bitmap is effectively the result of the bitwise OR of the given bitmaps:
 *
 *                    000000000011
 *                    0000000000000001
 *                    111100000000000011
 *                    ------------------
 *                    111100000011000111
 *
 */
export const bitwiseOR = (...bitmaps) => {
  const resultBitmap = withBitmapStateMap({ bitmaps })(
    ({ map, resultBitmap }) => {
      // Each execution of this callback corresponds to an iteration of the internal while loop
      // of the function returned by `withBitmapStateMap` which executes as long as the bitmap state map `map` is not empty
      // (meaning that it's not an empty object).
      // `map` and `resultBitmap` are mutable here (they can and need to be mutated).
      const { key: index, value: bitmapState } = objectMin(map, {
        returnAsKeyVal: true,
        comparator: (bitmapAState, bitmapBState) => {
          const areBitmapAStateOnes = bitmapAState.i % 2 === 1;
          const areBitmapBStateOnes = bitmapBState.i % 2 === 1;
          if (areBitmapAStateOnes && areBitmapBStateOnes) {
            // If both bitmap states are on ones,
            // return the bitmap state with the highest number of consumable ones.
            return bitmapBState.bits - bitmapAState.bits;
          } else if (areBitmapAStateOnes) {
            // `bitmapAState` is the current bitmap state with the highest number
            // of consumable ones.
            return -1;
          } else if (areBitmapBStateOnes) {
            // Retain `bitmapBState` as it is the current bitmap state with the highest number
            // of consumable ones.
            return 1;
          } else {
            // Both bitmap states represent consumable zeros.
            // In this case the bitmap state with the minimum number of bits is used.
            return bitmapAState.bits - bitmapBState.bits;
          }
        },
      });

      const shouldConsumeOnes = bitmapState.i % 2 === 1;
      const bitsToConsume = bitmapState.bits;
      delete map[index];
      if (shouldConsumeOnes) {
        // Consume ones.
        for (const otherIndex in map) {
          let bitsToConsumeForCurrentBitmapState = bitsToConsume;
          do {
            map[otherIndex].bits -= bitsToConsumeForCurrentBitmapState;
            if (map[otherIndex].bits < 0) {
              bitsToConsumeForCurrentBitmapState = Math.abs(
                map[otherIndex].bits
              );
              map[otherIndex].bits = 0;
            } else {
              bitsToConsumeForCurrentBitmapState = 0;
            }
            if (map[otherIndex].bits <= 0) {
              // `map[otherIndex].bits` can never be less than 0 at this point
              // (it's an invariant because `map[otherIndex].bits` is either positive or 0 here).
              map[otherIndex].i++;
              if (
                typeof bitmaps[otherIndex][map[otherIndex].i] !== "undefined"
              ) {
                map[otherIndex].bits = bitmaps[otherIndex][map[otherIndex].i];
              } else {
                delete map[otherIndex];
              }
            }
          } while (map[otherIndex] && bitsToConsumeForCurrentBitmapState > 0);
        }
        const lastResultBitmapIndex = resultBitmap.length - 1;
        if (lastResultBitmapIndex % 2 === 1) {
          resultBitmap[lastResultBitmapIndex] += bitsToConsume; // Add ones to previous chunk.
        } else {
          resultBitmap.push(bitsToConsume); // Add ones.
        }
      } else {
        // Consume zeros.
        resultBitmap.push(bitsToConsume); // Add zeros.
        for (const otherIndex in map) {
          map[otherIndex].bits -= bitsToConsume;
          if (map[otherIndex].bits <= 0) {
            // `map[otherIndex].bits` can never be less than 0 at this point
            // (it's an invariant because the minimum `map[index].bits` was the minimum value).
            map[otherIndex].i++;
            if (typeof bitmaps[otherIndex][map[otherIndex].i] !== "undefined") {
              map[otherIndex].bits = bitmaps[otherIndex][map[otherIndex].i];
            } else {
              delete map[otherIndex];
            }
          }
        }
      }
      map[index] = bitmapState;
      map[index].i++;
      if (typeof bitmaps[index][map[index].i] !== "undefined") {
        map[index].bits = bitmaps[index][map[index].i];
      } else {
        delete map[index];
      }
    }
  );
  return resultBitmap;
};

/**
 * Computes a bitwise AND of the given run-length encoded bitmaps.
 *
 * @param {...number[]} bitmaps A list of run-length encoded bitmap arrays, see {@link bitwiseOR}.
 * @return {number[]} A new bitmap array representing the bitwise AND of the given bitmap arrays.
 *
 *                    Example:
 *                    `[0, 3, 2, 4, 1, 1, 2, 1]` represents the bitmap `11100111101001`.
 *                    `[1, 1, 1, 3, 1, 1, 1, 2, 1, 2, 1, 1]` represents the bitmap `0101110101101101`.
 *                    `[0, 6, 2, 1, 1, 5, 1, 1]` represents the bitmap `11111100101111101`.
 *
 *                    Then:
 *
 *                    ```
 *                    bitwiseAND([0, 3, 2, 4, 1, 1, 2, 1], [1, 1, 1, 3, 1, 1, 1, 2, 1, 2, 1, 1], [0, 6, 2, 1, 1, 5, 1, 1]);
 *                    ```
 *
 *                    Would return `[1, 1, 3, 1, 4, 1, 2, 1]` (`01000100001001`).
 *                    This bitmap is effectively the result of the bitwise AND of the given bitmaps:
 *
 *                    11100111101001
 *                    0101110101101101
 *                    11111100101111101
 *                    -----------------
 *                    01000100001001000
 *
 */
export const bitwiseAND = (...bitmaps) => {
  let isThereABitmapWithoutASequenceOfBits = false;
  const func = withBitmapStateMap({
    bitmaps,
    onBitmapWithoutSequenceOfBits: () =>
      (isThereABitmapWithoutASequenceOfBits = true),
  });
  if (isThereABitmapWithoutASequenceOfBits) {
    return [];
  }
  const resultBitmap = func(({ map, resultBitmap }) => {
    // An iteration of the internal while loop of the function returned by `withBitmapStateMap`.
    const { key: index, value: bitmapState } = objectMin(map, {
      returnAsKeyVal: true,
      comparator: (bitmapAState, bitmapBState) => {
        const areBitmapAStateZeros = bitmapAState.i % 2 === 0;
        const areBitmapBStateZeros = bitmapBState.i % 2 === 0;
        if (areBitmapAStateZeros && areBitmapBStateZeros) {
          // If both bitmap states are on zeros,
          // return the bitmap state with the highest number of consumable zeros.
          return bitmapBState.bits - bitmapAState.bits;
        } else if (areBitmapAStateZeros) {
          // `bitmapAState` is the current bitmap state with the highest number
          // of consumable zeros.
          return -1;
        } else if (areBitmapBStateZeros) {
          // Retain `bitmapBState` as it is the current bitmap state with the highest number
          // of consumable zeros.
          return 1;
        } else {
          // Both bitmap states represent consumable ones.
          // In this case the bitmap state with the minimum number of bits is used.
          return bitmapAState.bits - bitmapBState.bits;
        }
      },
    });

    const shouldConsumeZeros = bitmapState.i % 2 === 0;
    const bitsToConsume = bitmapState.bits;
    delete map[index];
    if (shouldConsumeZeros) {
      // Consume zeros.
      for (const otherIndex in map) {
        let bitsToConsumeForCurrentBitmapState = bitsToConsume;
        do {
          map[otherIndex].bits -= bitsToConsumeForCurrentBitmapState;
          if (map[otherIndex].bits < 0) {
            bitsToConsumeForCurrentBitmapState = Math.abs(map[otherIndex].bits);
            map[otherIndex].bits = 0;
          } else {
            bitsToConsumeForCurrentBitmapState = 0;
          }
          if (map[otherIndex].bits <= 0) {
            // `map[otherIndex].bits` can never be less than 0 at this point
            // (it's an invariant because `map[otherIndex].bits` is either positive or 0 here).
            map[otherIndex].i++;
            if (typeof bitmaps[otherIndex][map[otherIndex].i] !== "undefined") {
              map[otherIndex].bits = bitmaps[otherIndex][map[otherIndex].i];
            } else {
              return resultBitmap;
            }
          }
        } while (bitsToConsumeForCurrentBitmapState > 0);
      }
      const lastResultBitmapIndex = resultBitmap.length - 1;
      if (lastResultBitmapIndex % 2 === 0) {
        resultBitmap[lastResultBitmapIndex] += bitsToConsume; // Add zeros to previous chunk.
      } else {
        resultBitmap.push(bitsToConsume); // Add zeros.
      }
    } else {
      // Consume ones.
      resultBitmap.push(bitsToConsume); // Add ones.
      for (const otherIndex in map) {
        map[otherIndex].bits -= bitsToConsume;
        if (map[otherIndex].bits <= 0) {
          // `map[otherIndex].bits` can never be less than 0 at this point
          // (it's an invariant because the minimum `map[index].bits` was the minimum value).
          map[otherIndex].i++;
          if (typeof bitmaps[otherIndex][map[otherIndex].i] !== "undefined") {
            map[otherIndex].bits = bitmaps[otherIndex][map[otherIndex].i];
          } else {
            return resultBitmap;
          }
        }
      }
    }
    map[index] = bitmapState;
    map[index].i++;
    if (typeof bitmaps[index][map[index].i] !== "undefined") {
      map[index].bits = bitmaps[index][map[index].i];
    } else {
      return resultBitmap;
    }
  });
  return resultBitmap;
};

/**
 * Computes a bitwise NOT of the given run-length encoded bitmaps.
 *
 * @param {number[]} bitmap A run-length encoded bitmap array, see {@link bitwiseOR}.
 * @return {number[]} A new bitmap array representing the bitwise NOT of the given bitmap array.
 */
export const bitwiseNOT = bitmap => {
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
export const bitwiseXOR = (...bitmaps) => {
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
