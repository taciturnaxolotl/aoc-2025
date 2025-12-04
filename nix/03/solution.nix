let
  input = builtins.readFile ../../shared/03/input.txt;
  banks = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  # Helper to convert string to list of digit ints
  stringToDigits = str:
    let
      len = builtins.stringLength str;
      indices = builtins.genList (i: i) len;
    in map (i: builtins.fromJSON (builtins.substring i 1 str)) indices;
  
  # Part 1: Find highest pair (largestI * 10 + jVal) for each bank
  part1 =
    let
      processBank = bank:
        let
          digits = stringToDigits bank;
          L = builtins.length digits;
          
          # For each position j, find the largest digit before it and form pair
          processPair = state: j:
            let
              jVal = builtins.elemAt digits j;
              # Find largest digit in digits[0..j-1]
              largestI = builtins.foldl' 
                (max: i: let iVal = builtins.elemAt digits i; in if iVal > max then iVal else max)
                (-1)
                (builtins.genList (i: i) j);
              pair = largestI * 10 + jVal;
              newHighest = if pair > state.highest then pair else state.highest;
            in { highest = newHighest; };
          
          # Process j from 1 to L-1
          result = builtins.foldl' 
            processPair 
            { highest = -1; }
            (builtins.genList (i: i + 1) (L - 1));
        in result.highest;
      
      jolts = map processBank banks;
    in builtins.foldl' builtins.add 0 jolts;
  
  # Part 2: Monotonic stack to find best K-digit number
  part2 =
    let
      K = 12;
      
      processBank = bank:
        let
          digits = stringToDigits bank;
          L = builtins.length digits;
          
          # Process each digit with monotonic stack approach
          processDigit = state: j:
            let
              jVal = builtins.elemAt digits j;
              remaining = L - j;
              
              # Pop smaller tail digits if we can still reach K
              popSmaller = stack:
                let
                  stackLen = builtins.length stack;
                  canPop = stackLen > 0 && 
                           (builtins.elemAt stack (stackLen - 1)) < jVal &&
                           stackLen - 1 + remaining >= K;
                in
                if canPop then
                  popSmaller (builtins.genList (i: builtins.elemAt stack i) (stackLen - 1))
                else
                  stack;
              
              newStack = popSmaller state.stack;
              stackLen = builtins.length newStack;
              
              # Add current digit if we still need more
              finalStack = if stackLen < K then newStack ++ [jVal] else newStack;
            in { stack = finalStack; };
          
          # Process all digits
          result = builtins.foldl' 
            processDigit 
            { stack = []; }
            (builtins.genList (i: i) L);
          
          # Convert stack to number
          stackToNum = builtins.foldl' (acc: d: acc * 10 + d) 0 result.stack;
        in stackToNum;
      
      jolts = map processBank banks;
    in builtins.foldl' builtins.add 0 jolts;

in {
  inherit part1 part2;
}
