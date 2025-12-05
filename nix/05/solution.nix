let
  input = builtins.readFile ../../shared/05/input.txt;
  
  # Split input into two sections
  sections = builtins.filter (s: s != "") (builtins.split "\n\n" input);
  rangesSection = builtins.head sections;
  ingredientsSection = builtins.elemAt sections 2; # sections are [ranges, "\n\n", ingredients]
  
  # Parse ranges from "start-end" format
  rangeLines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" rangesSection);
  parsedRanges = builtins.map (line:
    let
      parts = builtins.filter (s: builtins.isString s && s != "") (builtins.split "-" line);
      start = builtins.fromJSON (builtins.head parts);
      end = builtins.fromJSON (builtins.elemAt parts 1);
    in { inherit start end; }
  ) rangeLines;
  
  # Sort ranges by start position using merge sort
  sortedRanges = 
    let
      merge = left: right:
        let
          mergeImpl = l: r: acc:
            if builtins.length l == 0 then acc ++ r
            else if builtins.length r == 0 then acc ++ l
            else
              let
                lHead = builtins.head l;
                rHead = builtins.head r;
                lTail = builtins.tail l;
                rTail = builtins.tail r;
              in if lHead.start <= rHead.start
                 then mergeImpl lTail r (acc ++ [lHead])
                 else mergeImpl l rTail (acc ++ [rHead]);
        in mergeImpl left right [];
      
      mergeSort = list:
        let len = builtins.length list;
        in if len <= 1 then list
           else
             let
               mid = len / 2;
               left = builtins.genList (i: builtins.elemAt list i) mid;
               right = builtins.genList (i: builtins.elemAt list (i + mid)) (len - mid);
             in merge (mergeSort left) (mergeSort right);
    in mergeSort parsedRanges;
  
  # Merge overlapping or adjacent ranges
  mergedRanges = 
    let
      merge = builtins.foldl' (state: range:
        if state.current == null then { current = range; result = []; }
        else
          let curr = state.current;
          in if curr.end + 1 >= range.start then
            # Overlapping or adjacent - merge
            { current = { start = curr.start; end = if curr.end > range.end then curr.end else range.end; };
              result = state.result; }
          else
            # Gap - save current and start new
            { current = range;
              result = state.result ++ [curr]; }
      ) { current = null; result = []; } sortedRanges;
    in if merge.current == null then merge.result else merge.result ++ [merge.current];
  
  # Parse ingredients
  ingredientLines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" ingredientsSection);
  ingredients = builtins.map (line: builtins.fromJSON line) ingredientLines;
  
  # Sort ingredients using merge sort
  sortedIngredients =
    let
      merge = left: right:
        let
          mergeImpl = l: r: acc:
            if builtins.length l == 0 then acc ++ r
            else if builtins.length r == 0 then acc ++ l
            else
              let
                lHead = builtins.head l;
                rHead = builtins.head r;
                lTail = builtins.tail l;
                rTail = builtins.tail r;
              in if lHead <= rHead
                 then mergeImpl lTail r (acc ++ [lHead])
                 else mergeImpl l rTail (acc ++ [rHead]);
        in mergeImpl left right [];
      
      mergeSort = list:
        let len = builtins.length list;
        in if len <= 1 then list
           else
             let
               mid = len / 2;
               left = builtins.genList (i: builtins.elemAt list i) mid;
               right = builtins.genList (i: builtins.elemAt list (i + mid)) (len - mid);
             in merge (mergeSort left) (mergeSort right);
    in mergeSort ingredients;
  
  # Part 1: Count ingredients that fall within merged ranges
  part1 =
    let
      # Use foldl' to process ingredients with range index tracking
      result = builtins.foldl' (state: ingredient:
        let
          # Find the appropriate range starting from current index
          findRange = rangeIdx:
            if rangeIdx >= builtins.length mergedRanges then { found = false; newIdx = rangeIdx; }
            else
              let range = builtins.elemAt mergedRanges rangeIdx;
              in if ingredient < range.start then { found = false; newIdx = rangeIdx; }
                 else if ingredient <= range.end then { found = true; newIdx = rangeIdx; }
                 else findRange (rangeIdx + 1);
          
          rangeResult = findRange state.rangeIdx;
        in {
          count = state.count + (if rangeResult.found then 1 else 0);
          rangeIdx = rangeResult.newIdx;
        }
      ) { count = 0; rangeIdx = 0; } sortedIngredients;
    in result.count;
  
  # Part 2: Total coverage of all merged ranges
  part2 = builtins.foldl' (sum: range: sum + (range.end - range.start + 1)) 0 mergedRanges;

in {
  inherit part1 part2;
}
