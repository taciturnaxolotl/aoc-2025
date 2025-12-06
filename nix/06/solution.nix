let
  input = builtins.readFile ../../shared/06/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  # Helper to get character at position or space if out of bounds
  charAt = str: idx: 
    if idx < 0 || idx >= builtins.stringLength str 
    then " " 
    else builtins.substring idx 1 str;
  
  # Find whitespace columns (columns that are all spaces/tabs in data rows)
  dataRows = builtins.genList (i: builtins.elemAt lines i) (builtins.length lines - 1);
  maxLen = builtins.foldl' (max: row: 
    let len = builtins.stringLength row; 
    in if len > max then len else max
  ) 0 dataRows;
  
  # Find columns that are all whitespace
  splitCols = builtins.filter (col: col != null) (builtins.genList (i:
    let
      allWS = builtins.foldl' (acc: row:
        acc && (let ch = charAt row i; in ch == " " || ch == "	")
      ) true dataRows;
    in if allWS then i else null
  ) maxLen);
  
  # Split each row at whitespace columns  
  splitRow = row:
    let
      rowLen = builtins.stringLength row;
      splitImpl = cuts: startPos: acc:
        if builtins.length cuts == 0
        then acc ++ [(builtins.substring startPos (rowLen - startPos) row)]
        else
          let
            cut = builtins.head cuts;
            restCuts = builtins.tail cuts;
            end = if cut + 1 > rowLen then rowLen else cut + 1;
            segment = builtins.substring startPos (end - startPos) row;
          in splitImpl restCuts end (acc ++ [segment]);
    in splitImpl splitCols 0 [];
  
  # Split all lines (including operator row)
  segmentedRows = builtins.map splitRow lines;
  
  # Transpose to get columns (problems)
  numProblems = builtins.length (builtins.head segmentedRows);
  problems = builtins.genList (colIdx:
    builtins.map (row: builtins.elemAt row colIdx) segmentedRows
  ) numProblems;
  
  # Fast trim - just remove spaces and tabs
  # Extract just digits from a string for numbers
  extractNum = str:
    let
      cleaned = builtins.replaceStrings [" " "	"] ["" ""] str;
    in if builtins.stringLength cleaned == 0 then 0 else builtins.fromJSON cleaned;
  
  # Extract operator
  extractOp = str:
    let
      cleaned = builtins.replaceStrings [" " "	"] ["" ""] str;
    in cleaned;
  
  # Part 1: Normal left-to-right evaluation
  part1 = builtins.foldl' (total: problem:
    let
      lastIdx = builtins.length problem - 1;
      operator = extractOp (builtins.elemAt problem lastIdx);
      nums = builtins.map (s: extractNum s) (builtins.genList (i: builtins.elemAt problem i) lastIdx);
      value = 
        if operator == "*"
        then builtins.foldl' (acc: n: acc * n) 1 nums
        else builtins.foldl' (acc: n: acc + n) 0 nums;
    in total + value
  ) 0 problems;
  
  # Part 2: Cepheid (vertical) reading
  part2 = builtins.foldl' (total: problem:
    let
      lastIdx = builtins.length problem - 1;
      operator = extractOp (builtins.elemAt problem lastIdx);
      numStrs = builtins.genList (i: builtins.elemAt problem i) lastIdx;
      
      # Find max width
      maxWidth = builtins.foldl' (max: s:
        let len = builtins.stringLength s;
        in if len > max then len else max
      ) 0 numStrs;
      
      # Read vertically from right to left
      cephNums = builtins.filter (n: n != null) (builtins.genList (colR:
        let
          # Build digits string from this column (right to left)
          idx = maxWidth - colR;
          digitsStr = builtins.concatStringsSep "" (builtins.filter (ch: ch != " " && ch != "	") (builtins.map (s:
            if idx >= 0 && idx < builtins.stringLength s
            then builtins.substring idx 1 s
            else " "
          ) numStrs));
        in if builtins.stringLength digitsStr > 0
           then builtins.fromJSON digitsStr
           else null
      ) (maxWidth + 1));
      
      value =
        if operator == "*"
        then builtins.foldl' (acc: n: acc * n) 1 cephNums
        else builtins.foldl' (acc: n: acc + n) 0 cephNums;
    in total + value
  ) 0 problems;

in {
  inherit part1 part2;
}
