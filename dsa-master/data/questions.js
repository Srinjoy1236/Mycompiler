const questions = [
  {
    id: 1,
    day: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    starterCode: {
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
}`,
      python: `def twoSum(nums: List[int], target: int) -> List[int]:
    # Write your code here
    pass`,
      java: `public int[] twoSum(int[] nums, int target) {
    // Write your code here
}`,
      javascript: `function twoSum(nums, target) {
    // Write your code here
};`
    }
  },
  // Add more questions...
];

module.exports = questions; 