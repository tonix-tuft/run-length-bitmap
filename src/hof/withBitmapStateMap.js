import { isObjectEmpty, noOpFn } from "js-utl";

/**
 * @type {Function}
 */
const withBitmapStateMap = ({
  bitmaps,
  onBitmapWithoutSequenceOfBits = noOpFn,
  onAllBitmapsWithoutSequenceOfBits = noOpFn,
}) => {
  let resultBitmap = [];
  const map = {};

  let areAllBitmapsWithoutSequenceOfBits = true;
  bitmaps.map((bitmap, index) => {
    const hasAtLeastOneSequenceOfBits = bitmap.length > 1;
    if (!hasAtLeastOneSequenceOfBits) {
      onBitmapWithoutSequenceOfBits(bitmap, index);
    } else {
      areAllBitmapsWithoutSequenceOfBits = false;
      if (!map[index]) {
        map[index] = {
          i: 0,
          bits: bitmap[0],
        };
      }
    }
  });
  if (areAllBitmapsWithoutSequenceOfBits) {
    onAllBitmapsWithoutSequenceOfBits();
  }

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
