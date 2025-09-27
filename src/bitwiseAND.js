import { objectMin } from "js-utl";
import withBitmapStateMap from "./hof/withBitmapStateMap";

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
const bitwiseAND = (...bitmaps) => {
  let isThereABitmapWithoutSequenceOfBits = false;

  const func = withBitmapStateMap({
    bitmaps,
    onBitmapWithoutSequenceOfBits: () =>
      (isThereABitmapWithoutSequenceOfBits = true),
  });

  if (isThereABitmapWithoutSequenceOfBits) {
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
export default bitwiseAND;
