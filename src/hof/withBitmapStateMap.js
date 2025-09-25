import { isObjectEmpty, noOpFn } from "js-utl";

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
export default withBitmapStateMap;
