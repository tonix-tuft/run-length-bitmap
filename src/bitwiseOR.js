import { objectMin } from "js-utl";
import withBitmapStateMap from "./hof/withBitmapStateMap";

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
const bitwiseOR = (...bitmaps) => {
  let areAllBitmapsWithoutSequenceOfBits = false;

  const func = withBitmapStateMap({
    bitmaps,
    onAllBitmapsWithoutSequenceOfBits: () =>
      (areAllBitmapsWithoutSequenceOfBits = true),
  });

  if (areAllBitmapsWithoutSequenceOfBits) {
    return [];
  }

  const resultBitmap = func(({ map, resultBitmap }) => {
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
  });
  return resultBitmap;
};
export default bitwiseOR;
