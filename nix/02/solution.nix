let
  input = builtins.readFile ../../shared/02/input.txt;
  
  # Parse comma-separated ranges into list of {start, end}
  ranges = 
    let
      rangeStrings = builtins.filter builtins.isString (builtins.split "," input);
      parseRange = str:
        let parts = builtins.match "([0-9]+)-([0-9]+)" str;
        in { start = builtins.fromJSON (builtins.elemAt parts 0); 
             end = builtins.fromJSON (builtins.elemAt parts 1); };
    in map parseRange rangeStrings;
  
  # Convert number to string digits
  numToStr = n: builtins.toString n;
  
  # Check if string has even length and halves are equal
  hasEqualHalves = str:
    let len = builtins.stringLength str;
        half = len / 2;
    in if len == 0 || (len / 2 * 2) != len then false
       else (builtins.substring 0 half str) == (builtins.substring half half str);
  
  # Check if string is repeating pattern of given chunk size
  isRepeating = str: chunkSize:
    let 
      len = builtins.stringLength str;
      chunk = builtins.substring 0 chunkSize str;
      checkPos = pos: 
        if pos >= len then true
        else if (builtins.substring pos chunkSize str) != chunk then false
        else checkPos (pos + chunkSize);
    in if len == 0 || (len / chunkSize * chunkSize) != len then false
       else checkPos 0;
  
  # Find smallest repeating chunk size for a string
  hasRepeatingPattern = str:
    let 
      len = builtins.stringLength str;
      checkSize = size:
        if size > len / 2 then false
        else if isRepeating str size then true
        else checkSize (size + 1);
    in if len == 0 then false else checkSize 1;
  
  # Process range in batches to avoid stack overflow
  sumRangeIf = predicate: start: end:
    let
      batchSize = 10000;
      numBatches = ((end - start + 1) + batchSize - 1) / batchSize;
      
      processBatch = i:
        let
          batchStart = start + i * batchSize;
          batchEnd = if batchStart + batchSize - 1 < end then batchStart + batchSize - 1 else end;
          nums = builtins.genList (n: batchStart + n) (batchEnd - batchStart + 1);
          validNums = builtins.filter predicate nums;
        in builtins.foldl' (a: n: a + n) 0 validNums;
        
    in builtins.foldl' (acc: i: acc + processBatch i) 0 (builtins.genList (i: i) numBatches);
  
  part1 =
    let
      processRange = acc: r:
        acc + sumRangeIf (n: hasEqualHalves (numToStr n)) r.start r.end;
    in builtins.foldl' processRange 0 ranges;
  
  part2 =
    let
      processRange = acc: r:
        acc + sumRangeIf (n: hasRepeatingPattern (numToStr n)) r.start r.end;
    in builtins.foldl' processRange 0 ranges;

in {
  inherit part1 part2;
}
