/**
 * Coding problem pool and deterministic per-task assignments.
 *
 * Source: the owner's Brave "Array" and "String" LeetCode problem-list
 * bookmarks (66 bookmark entries, 60 unique problems after removing two
 * cross-list duplicates, three problem-list pages, and the site root).
 * URLs are public problem pages - no personal data.
 *
 * The canonical plan budgets 30 well-reviewed timed problems. Assignments
 * cover 25 of those slots (baseline + two per Monday session weeks 2-10 +
 * one per recorded coding mock); the remaining 35 bookmarked problems form
 * the backlog pool for week 13 targeted repair and maintenance mode.
 */

import type { TaskResource } from "./schemas";

export interface CodingProblem {
  /** Stable id: lc-<slug>. */
  id: string;
  slug: string;
  title: string;
  url: string;
  difficulty: "easy" | "medium";
  pattern: string;
}

const problem = (
  slug: string,
  title: string,
  difficulty: "easy" | "medium",
  pattern: string,
): CodingProblem => ({
  id: `lc-${slug}`,
  slug,
  title,
  url: `https://leetcode.com/problems/${slug}/description/`,
  difficulty,
  pattern,
});

/**
 * All 60 unique bookmarked problems. Difficulty and pattern were verified
 * against the LeetCode problem pages at import time.
 */
export const CODING_PROBLEMS: CodingProblem[] = [
  // Arrays - two pointers and interval-style
  problem("3sum", "3Sum", "medium", "two-pointers"),
  problem("3sum-closest", "3Sum Closest", "medium", "two-pointers"),
  problem("4sum", "4Sum", "medium", "two-pointers"),
  problem(
    "two-sum-ii-input-array-is-sorted",
    "Two Sum II - Input Array Is Sorted",
    "medium",
    "two-pointers",
  ),
  problem("container-with-most-water", "Container With Most Water", "medium", "two-pointers"),
  problem("sort-colors", "Sort Colors", "medium", "two-pointers"),
  problem(
    "remove-duplicates-from-sorted-array-ii",
    "Remove Duplicates from Sorted Array II",
    "medium",
    "two-pointers",
  ),
  problem("boats-to-save-people", "Boats to Save People", "medium", "two-pointers"),
  problem("rotate-array", "Rotate Array", "medium", "array-manipulation"),
  problem(
    "the-k-strongest-values-in-an-array",
    "The k Strongest Values in an Array",
    "medium",
    "two-pointers",
  ),
  // Arrays - sliding window
  problem("minimum-size-subarray-sum", "Minimum Size Subarray Sum", "medium", "sliding-window"),
  problem(
    "longest-repeating-character-replacement",
    "Longest Repeating Character Replacement",
    "medium",
    "sliding-window",
  ),
  // Arrays - binary search and search-on-answer
  problem(
    "search-in-rotated-sorted-array",
    "Search in Rotated Sorted Array",
    "medium",
    "binary-search",
  ),
  problem(
    "search-in-rotated-sorted-array-ii",
    "Search in Rotated Sorted Array II",
    "medium",
    "binary-search",
  ),
  problem(
    "find-minimum-in-rotated-sorted-array",
    "Find Minimum in Rotated Sorted Array",
    "medium",
    "binary-search",
  ),
  problem(
    "find-first-and-last-position-of-element-in-sorted-array",
    "Find First and Last Position of Element in Sorted Array",
    "medium",
    "binary-search",
  ),
  problem("find-k-closest-elements", "Find K Closest Elements", "medium", "binary-search"),
  problem("koko-eating-bananas", "Koko Eating Bananas", "medium", "binary-search"),
  problem(
    "capacity-to-ship-packages-within-d-days",
    "Capacity To Ship Packages Within D Days",
    "medium",
    "binary-search",
  ),
  // Arrays - stacks
  problem(
    "evaluate-reverse-polish-notation",
    "Evaluate Reverse Polish Notation",
    "medium",
    "stack",
  ),
  problem("asteroid-collision", "Asteroid Collision", "medium", "stack"),
  problem("daily-temperatures", "Daily Temperatures", "medium", "monotonic-stack"),
  problem("car-fleet", "Car Fleet", "medium", "sorting"),
  // Arrays - hashing, prefix sums, counting
  problem("group-anagrams", "Group Anagrams", "medium", "hashing"),
  problem("valid-sudoku", "Valid Sudoku", "medium", "hashing"),
  problem("longest-consecutive-sequence", "Longest Consecutive Sequence", "medium", "hashing"),
  problem("subarray-sum-equals-k", "Subarray Sum Equals K", "medium", "prefix-sum"),
  problem("product-of-array-except-self", "Product of Array Except Self", "medium", "prefix-sum"),
  problem("h-index", "H-Index", "medium", "counting"),
  problem("majority-element-ii", "Majority Element II", "medium", "counting"),
  problem("top-k-frequent-elements", "Top K Frequent Elements", "medium", "heap"),
  problem(
    "find-the-kth-largest-integer-in-the-array",
    "Find the Kth Largest Integer in the Array",
    "medium",
    "heap",
  ),
  problem(
    "range-sum-of-sorted-subarray-sums",
    "Range Sum of Sorted Subarray Sums",
    "medium",
    "heap",
  ),
  // Arrays - greedy and Kadane-style
  problem("best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "easy", "greedy"),
  problem(
    "best-time-to-buy-and-sell-stock-ii",
    "Best Time to Buy and Sell Stock II",
    "medium",
    "greedy",
  ),
  problem(
    "maximum-difference-between-increasing-elements",
    "Maximum Difference Between Increasing Elements",
    "easy",
    "greedy",
  ),
  problem("jump-game", "Jump Game", "medium", "greedy"),
  problem("jump-game-ii", "Jump Game II", "medium", "greedy"),
  // Arrays - dynamic programming
  problem("maximum-subarray", "Maximum Subarray", "medium", "dynamic-programming"),
  problem(
    "best-time-to-buy-and-sell-stock-with-transaction-fee",
    "Best Time to Buy and Sell Stock with Transaction Fee",
    "medium",
    "dynamic-programming",
  ),
  problem(
    "best-time-to-buy-and-sell-stock-with-cooldown",
    "Best Time to Buy and Sell Stock with Cooldown",
    "medium",
    "dynamic-programming",
  ),
  problem("triangle", "Triangle", "medium", "dynamic-programming"),
  // Arrays - backtracking and grid search
  problem("combination-sum", "Combination Sum", "medium", "backtracking"),
  problem("word-search", "Word Search", "medium", "backtracking"),
  problem("max-area-of-island", "Max Area of Island", "medium", "graph-dfs"),
  // Strings
  problem(
    "longest-substring-without-repeating-characters",
    "Longest Substring Without Repeating Characters",
    "medium",
    "sliding-window",
  ),
  problem(
    "longest-palindromic-substring",
    "Longest Palindromic Substring",
    "medium",
    "dynamic-programming",
  ),
  problem("palindromic-substrings", "Palindromic Substrings", "medium", "dynamic-programming"),
  problem("generate-parentheses", "Generate Parentheses", "medium", "backtracking"),
  problem("palindrome-partitioning", "Palindrome Partitioning", "medium", "backtracking"),
  problem("count-and-say", "Count and Say", "medium", "simulation"),
  problem("multiply-strings", "Multiply Strings", "medium", "simulation"),
  problem("reverse-words-in-a-string", "Reverse Words in a String", "medium", "simulation"),
  problem("decode-string", "Decode String", "medium", "stack"),
  problem(
    "maximize-the-confusion-of-an-exam",
    "Maximize the Confusion of an Exam",
    "medium",
    "sliding-window",
  ),
  problem("permutation-in-string", "Permutation in String", "medium", "sliding-window"),
  problem("vowels-of-all-substrings", "Vowels of All Substrings", "medium", "prefix-sum"),
  problem(
    "longest-uncommon-subsequence-ii",
    "Longest Uncommon Subsequence II",
    "medium",
    "strings",
  ),
  problem(
    "longest-word-in-dictionary-through-deleting",
    "Longest Word in Dictionary through Deleting",
    "medium",
    "strings",
  ),
  problem("camelcase-matching", "Camelcase Matching", "medium", "strings"),
];

const PROBLEM_BY_ID: Record<string, CodingProblem> = Object.fromEntries(
  CODING_PROBLEMS.map((item) => [item.id, item]),
);

export function getCodingProblem(id: string): CodingProblem | undefined {
  return PROBLEM_BY_ID[id];
}

/**
 * Timed assignments. Two problems per Monday session weeks 2-10 mirror the
 * canonical routine; coding mocks run one problem plus scoring and review.
 * Difficulty ramps from sliding-window/hashing staples toward stacks, greedy,
 * dynamic programming, and backtracking, matching the plan's week-2 topic
 * guidance (hash maps/strings, intervals, graph traversal, heap/top-k).
 */
export const CODING_PROBLEM_ASSIGNMENTS: Record<string, string[]> = {
  "w01-mon": ["lc-longest-substring-without-repeating-characters", "lc-max-area-of-island"],
  "w02-mon": ["lc-group-anagrams", "lc-top-k-frequent-elements"],
  "w03-mon": ["lc-3sum", "lc-container-with-most-water"],
  "w04-mon": ["lc-minimum-size-subarray-sum", "lc-longest-repeating-character-replacement"],
  "w05-mon": ["lc-search-in-rotated-sorted-array", "lc-koko-eating-bananas"],
  "w06-mon": ["lc-daily-temperatures", "lc-asteroid-collision"],
  "w07-mon": ["lc-subarray-sum-equals-k", "lc-product-of-array-except-self"],
  "w08-mon": ["lc-jump-game", "lc-best-time-to-buy-and-sell-stock-ii"],
  "w09-mon": ["lc-maximum-subarray", "lc-triangle"],
  "w10-mon": ["lc-combination-sum", "lc-generate-parentheses"],
  "w11-mon": ["lc-find-first-and-last-position-of-element-in-sorted-array"],
  "w11-wed": ["lc-valid-sudoku"],
  "w12-mon": ["lc-evaluate-reverse-polish-notation"],
  "w13-mon": ["lc-decode-string"],
  "w14-mon": ["lc-find-minimum-in-rotated-sorted-array"],
};

/** Bookmarked problems not assigned to a scheduled session; the repair pool. */
export const CODING_PROBLEM_BACKLOG_IDS: string[] = CODING_PROBLEMS.map((item) => item.id).filter(
  (id) => !Object.values(CODING_PROBLEM_ASSIGNMENTS).flat().includes(id),
);

/** Canonical plan target: 25 fixed assignments plus five user-scheduled flex picks. */
export const CODING_TARGET_COUNT = 30;
const ASSIGNED_PROBLEM_IDS = Object.values(CODING_PROBLEM_ASSIGNMENTS).flat();
export const CODING_FLEX_TARGET_IDS = CODING_PROBLEM_BACKLOG_IDS.slice(
  0,
  CODING_TARGET_COUNT - ASSIGNED_PROBLEM_IDS.length,
);
export const CODING_CORE_TARGET_IDS = [...ASSIGNED_PROBLEM_IDS, ...CODING_FLEX_TARGET_IDS];

const PROBLEM_INSTRUCTION =
  "Timed attempt (40 minutes max): state time and space complexity upfront, implement, and run edge-case tests without AI assistance. Then fully review: classify every miss in the mistake log and re-solve missed parts from a blank page.";

export function codingProblemResource(item: CodingProblem): TaskResource {
  return {
    id: item.id,
    title: `${item.title} (LeetCode ${item.difficulty} - ${item.pattern})`,
    url: item.url,
    priority: "must",
    type: "exercise",
    instruction: PROBLEM_INSTRUCTION,
    estimatedMinutes: 40,
  };
}
