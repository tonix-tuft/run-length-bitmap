import cases from "jest-in-case";
import { bitwiseOR, bitwiseAND, bitwiseXOR, bitwiseNOT } from "./index";

/**
 * @type {Array<{
 *   name: string,
 *   bitmaps: Array<number[]>,
 *   expectedOR: number[],
 *   expectedAND: number[],
 *   expectedXOR: number[],
 *   detail: string
 * }>}
 */
const testCases = [
  {
    name: "Three disjoint bitmaps. OR combines them all. AND is empty. XOR same as OR since no overlaps.",
    bitmaps: [
      [10, 2],
      [15, 1],
      [0, 4, 12, 2],
    ],
    expectedOR: [0, 4, 6, 2, 3, 3],
    expectedAND: [],
    expectedXOR: [0, 4, 6, 2, 3, 3],
    detail: `
000000000011...... [10, 2]
0000000000000001.. [15, 1]
111100000000000011 [0, 4, 12, 2]
------------------
111100000011000111 [0, 4, 6, 2, 3, 3] <- OR
000000000000000000 [] <----------------- AND
111100000011000111 [0, 4, 6, 2, 3, 3] <- XOR
`,
  },
  {
    name: "Two overlapping runs. OR merges them. AND is the overlap. XOR removes overlap, leaving disjoint runs.",
    bitmaps: [
      [0, 4],
      [2, 4],
    ],
    expectedOR: [0, 6],
    expectedAND: [2, 2],
    expectedXOR: [0, 2, 2, 2],
    detail: `
1111.. [0, 4]
001111 [2, 4]
------
111111 [0, 6] <------- OR
0011.. [2, 2] <------- AND
110011 [0, 2, 2, 2] <- XOR
`,
  },
  {
    name: "Single bitmap, no operation really — OR, AND, XOR all same as input.",
    bitmaps: [[5, 1]],
    expectedOR: [5, 1],
    expectedAND: [5, 1],
    expectedXOR: [5, 1],
    detail: `
000001 [5, 1]
------
000001 [5, 1] <- OR
000001 [5, 1] <- AND
000001 [5, 1] <- XOR
`,
  },
  {
    name: "Full block 1-8 with subsets 3-4 and 5-6. OR covers full 1-8. AND empty. XOR cancels overlaps, leaving only a bit set to 1 if it's only set to 1 on that bitmask and not in all the other ones.",
    bitmaps: [
      [0, 8],
      [2, 2],
      [4, 2],
    ],
    expectedOR: [0, 8],
    expectedAND: [],
    expectedXOR: [0, 2, 4, 2],
    detail: `
11111111 [0, 8]
0011.... [2, 2]
000011.. [4, 2]
--------
11111111 [0, 8] <------- OR
00000000 [] <----------- AND
11000011 [0, 2, 4, 2] <- XOR
`,
  },
  {
    name: "Two identical single-bit sets. OR = AND, they are the same. XOR cancels completely.",
    bitmaps: [
      [0, 1],
      [0, 1],
    ],
    expectedOR: [0, 1],
    expectedAND: [0, 1],
    expectedXOR: [],
    detail: `
1 [0, 1]
1 [0, 1]
-
1 [0, 1] <- OR
1 [0, 1] <- AND
0 [] <----- XOR
`,
  },
  {
    name: "First is 1-16, second is 9-16. OR is 1-16. AND is overlap 9-16. XOR is 1-8.",
    bitmaps: [
      [0, 16],
      [8, 8],
    ],
    expectedOR: [0, 16],
    expectedAND: [8, 8],
    expectedXOR: [0, 8],
    detail: `
1111111111111111 [0, 16]
0000000011111111 [8, 8]
-------------------------------
1111111111111111 [0, 16] <- OR
0000000011111111 [8, 8] <-- AND
11111111........ [0, 8] <-- XOR
`,
  },
  {
    name: "Two disjoint ranges (3-4 and 7-8). OR combines them, AND empty, XOR same as OR.",
    bitmaps: [
      [2, 2],
      [6, 2],
    ],
    expectedOR: [2, 2, 2, 2],
    expectedAND: [],
    expectedXOR: [2, 2, 2, 2],
    detail: `
0011.... [2, 2]
00000011 [6, 2]
--------
00110011 [2, 2, 2, 2] <- OR
00000000 [] <----------- AND
00110011 [2, 2, 2, 2] <- XOR
`,
  },
  {
    name: "Three consecutive singles. OR merges to 1-3. AND empty. XOR same as OR since no overlap.",
    bitmaps: [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    expectedOR: [0, 3],
    expectedAND: [],
    expectedXOR: [0, 3],
    detail: `
1.. [0, 1]
01. [1, 1]
001 [2, 1]
---
111 [0, 3] <- OR
000 [] <----- AND
111 [0, 3] <- XOR
`,
  },
  {
    name: "Empty bitmap.",
    bitmaps: [[]],
    expectedOR: [],
    expectedAND: [],
    expectedXOR: [],
    detail: `
... []
---
... [] <- OR
... [] <- AND
... [] <- XOR

`,
  },
  {
    name: "One of the bitmaps is empty.",
    bitmaps: [[0, 1, 1, 1], [], [2, 1]],
    expectedOR: [0, 1, 1, 1],
    expectedAND: [],
    expectedXOR: [0, 1],
    detail: `
101 [0, 1, 1, 1]
... []
001 [2, 1]
---
101 [0, 1, 1, 1] <- OR
... [] <----------- AND
100 [0, 1] <------- XOR
`,
  },
  {
    name: "No bitmaps.",
    bitmaps: [],
    expectedOR: [],
    expectedAND: [],
    expectedXOR: [],
  },
  {
    name: "A bitmap with zeros.",
    bitmaps: [[1001]],
    expectedOR: [],
    expectedAND: [],
    expectedXOR: [],
  },
  {
    name: "Two bitmaps with zeros.",
    bitmaps: [[1001], [7]],
    expectedOR: [],
    expectedAND: [],
    expectedXOR: [],
  },
  {
    name: "Several bitmaps with zeros.",
    bitmaps: [[1001], [7], [7838291893], [5]],
    expectedOR: [],
    expectedAND: [],
    expectedXOR: [],
  },
  {
    name: "Some bitmaps with trailing zeros.",
    bitmaps: [[1001, 12, 30], [60, 950], [10], [7838291893, 9, 120], [5]],
    expectedOR: [60, 953, 7838291893 - 60 - 953, 9],
    expectedAND: [],
    expectedXOR: [60, 941, 9, 3, 7838291893 - 60 - 941 - 9 - 3, 9],
    detail: `

  _ 1001 __    __ 12 __
 /         \  /        \
/           \/          \
000000-000000111111111111000000000000000000000000000000.............................................. [1001, 12, 30]
00-00111-1111111111111............................................................................... [60, 950]
\   /\               /
 \ /  \             /
 60    ‾‾‾‾ 950 ‾‾‾‾

0000000000........................................................................................... [10]
0000000000000000000000000000000000000000-000000000000000000000000000000000000000011111111100000-00000 [7838291893, 9, 120]
\                                                                               /\       /\         /
 \                                                                             /  \     /  \       /
  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾ 7838291893 ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾    ‾ 9 ‾    ‾ 120 ‾

00000................................................................................................ [5]
-----------------------------------------------------------------------------------------------------
00-00111-1111111111111111000000000000000-0000000000000000000000000000000000000000111111111........... [60, 953, 7838291893 - 60 - 953, 9] <- OR
\   /\                  /                                                       |\       /
 \ /  \                /                                                        | \     /
 60    ‾‾‾‾‾ 953 ‾‾‾‾‾‾                                                         |  \   /
\                                                                               /    9
 \                                                                             /  
  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾ 7838291893 ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾

00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000 [] <----------- AND

00-00111-1111111111111111000000000000000-0000000000000000000000000000000000000000111111111........... [60, 953, 7838291893 - 60 - 953, 9] <- XOR
\   /\      /                                                                   |\       /
 \ /  \    /                                                                    | \     /
 60    941                                                                      |  \   /
\                                                                               /    9
 \                                                                             /  
  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾ 7838291893 ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
`,
  },
  {
    name: "Bitmap with trailing zeros to set in the bitmap state map when switching to the next index/set of bits in the bitmap when computing the AND between the bitmaps.",
    bitmaps: [
      [1, 2, 3],
      [1, 2, 4, 1],
    ],
    expectedOR: [1, 2, 4, 1],
    expectedAND: [1, 2],
    expectedXOR: [7, 1],
  },
  {
    name: "Bitmaps with trailing zeros to consume and no more bits when switching to the next index/set of bits in the bitmap when computing the OR between the bitmaps.",
    bitmaps: [
      [1, 2, 3],
      [1, 3, 2],
    ],
    expectedOR: [1, 3],
    expectedAND: [1, 2],
    expectedXOR: [3, 1],
  },
];

/**
 * @type {Array<{
 *   name: string,
 *   bitmap: number[],
 *   expectedNOT: number[],
 *   detail: string
 * }>}
 */
const bitwiseNOTTestCases = [
  {
    name: "Case 1.",
    bitmap: [10, 2],
    expectedNOT: [0, 10, 2, 9_007_199_254_740_991 - 10 - 2],
  },
  {
    name: "Case 2.",
    bitmap: [15, 1],
    expectedNOT: [0, 15, 1, 9_007_199_254_740_991 - 15 - 1],
  },
  {
    name: "Case 3.",
    bitmap: [0, 4, 12, 2],
    expectedNOT: [4, 12, 2, 9_007_199_254_740_991 - 4 - 12 - 2],
  },
  {
    name: "Case 4.",
    bitmap: [0, 4, 6, 2, 3, 3],
    expectedNOT: [4, 6, 2, 3, 3, 9_007_199_254_740_991 - 4 - 6 - 2 - 3 - 3],
  },
  {
    name: "Case 5.",
    bitmap: [0, 4],
    expectedNOT: [4, 9_007_199_254_740_991 - 4],
  },
  {
    name: "Case 6.",
    bitmap: [2, 4],
    expectedNOT: [0, 2, 4, 9_007_199_254_740_991 - 2 - 4],
  },
  {
    name: "Case 7.",
    bitmap: [0, 6],
    expectedNOT: [6, 9_007_199_254_740_991 - 6],
  },
  {
    name: "Case 8.",
    bitmap: [2, 2],
    expectedNOT: [0, 2, 2, 9_007_199_254_740_991 - 2 - 2],
  },
  {
    name: "Case 9.",
    bitmap: [0, 2, 2, 2],
    expectedNOT: [2, 2, 2, 9_007_199_254_740_991 - 2 - 2 - 2],
  },
  {
    name: "Case 10.",
    bitmap: [5, 1],
    expectedNOT: [0, 5, 1, 9_007_199_254_740_991 - 5 - 1],
  },
  {
    name: "Case 11.",
    bitmap: [0, 8],
    expectedNOT: [8, 9_007_199_254_740_991 - 8],
  },
  {
    name: "Case 12.",
    bitmap: [4, 2],
    expectedNOT: [0, 4, 2, 9_007_199_254_740_991 - 4 - 2],
  },
  {
    name: "Case 13.",
    bitmap: [0, 1],
    expectedNOT: [1, 9_007_199_254_740_991 - 1],
  },
  {
    name: "Case 14.",
    bitmap: [0, 16],
    expectedNOT: [16, 9_007_199_254_740_991 - 16],
  },
  {
    name: "Case 15.",
    bitmap: [8, 8],
    expectedNOT: [0, 8, 8, 9_007_199_254_740_991 - 8 - 8],
  },
  {
    name: "Case 16.",
    bitmap: [6, 2],
    expectedNOT: [0, 6, 2, 9_007_199_254_740_991 - 6 - 2],
  },
  {
    name: "Case 17.",
    bitmap: [1, 1],
    expectedNOT: [0, 1, 1, 9_007_199_254_740_991 - 1 - 1],
  },
  {
    name: "Case 18.",
    bitmap: [0, 1, 1, 1],
    expectedNOT: [1, 1, 1, 9_007_199_254_740_991 - 1 - 1 - 1],
  },
  {
    name: "Case 19.",
    bitmap: [2, 1],
    expectedNOT: [0, 2, 1, 9_007_199_254_740_991 - 2 - 1],
  },
  {
    name: "Case 20.",
    bitmap: [],
    expectedNOT: [0, 9_007_199_254_740_991],
  },
  {
    name: "Case 21 - Trailing zeros 1.",
    bitmap: [1001, 2, 98],
    expectedNOT: [0, 1001, 2, 9_007_199_254_740_991 - 1001 - 2],
  },
  {
    name: "Case 22 - Trailing zeros 2.",
    bitmap: [1, 2, 3, 4, 5, 6, 7],
    expectedNOT: [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      9_007_199_254_740_991 - 1 - 2 - 3 - 4 - 5 - 6,
    ],
  },
  {
    name: "Case 23 - Trailing zeros 3 - Leading ones.",
    bitmap: [0, 632, 8],
    expectedNOT: [632, 9_007_199_254_740_991 - 632],
  },
];

describe("run-length-bitmap", () => {
  describe("bitwiseOR", () => {
    cases(
      "it computes a bitwise OR of the given run-length encoded bitmaps",
      ({ bitmaps, expectedOR }) => {
        const result = bitwiseOR(...bitmaps);
        expect(result).toEqual(expectedOR);
      },
      testCases
    );
  });

  describe("bitwiseAND", () => {
    cases(
      "it computes a bitwise AND of the given run-length encoded bitmaps",
      ({ bitmaps, expectedAND }) => {
        const result = bitwiseAND(...bitmaps);
        expect(result).toEqual(expectedAND);
      },
      testCases
    );
  });

  describe("bitwiseXOR", () => {
    cases(
      "it computes a bitwise XOR of the given run-length encoded bitmaps",
      ({ bitmaps, expectedXOR }) => {
        const result = bitwiseXOR(...bitmaps);
        expect(result).toEqual(expectedXOR);
      },
      testCases
    );
  });

  describe("bitwiseNOT", () => {
    cases(
      "it computes a bitwise NOT of the given run-length encoded bitmap",
      ({ bitmap, expectedNOT }) => {
        const result = bitwiseNOT(bitmap);
        expect(result).toEqual(expectedNOT);
      },
      bitwiseNOTTestCases
    );
  });
});
