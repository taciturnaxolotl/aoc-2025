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
  
  # Generate all numbers with equal halves in a range
  generateEqualHalves = start: end:
    let
      startLen = builtins.stringLength (builtins.toString start);
      endLen = builtins.stringLength (builtins.toString end);
      
      # For even digit counts, generate patterns directly
      generateForDigits = numDigits:
        let
          halfDigits = numDigits / 2;
          isEven = (numDigits - halfDigits * 2) == 0;
        in
        if !isEven || numDigits < 2 then []
        else
          let
            # Calculate 10^halfDigits for multiplier
            multiplier = builtins.foldl' (a: _: a * 10) 1 (builtins.genList (x: x) halfDigits);
            halfMin = multiplier / 10;
            halfMax = multiplier - 1;
            
            # Generate number from half: n = half * (10^half + 1)
            makeNum = half: half * (multiplier + 1);
            
            minVal = makeNum halfMin;
            maxVal = makeNum halfMax;
            
            # Only generate if range overlaps
            actualMin = if minVal < start then 
                          let h = (start + multiplier) / (multiplier + 1); in if makeNum h >= start then h else h + 1
                        else halfMin;
            actualMax = if maxVal > end then
                          end / (multiplier + 1)
                        else halfMax;
            
            count = if actualMax >= actualMin then actualMax - actualMin + 1 else 0;
          in
          if count > 0 then builtins.genList (i: makeNum (actualMin + i)) count else [];
      
      allDigits = builtins.genList (d: startLen + d) (endLen - startLen + 1);
      allNums = builtins.concatMap generateForDigits allDigits;
    in allNums;
  
  # Generate all repeating pattern numbers in a range  
  generateRepeating = start: end:
    let
      startLen = builtins.stringLength (builtins.toString start);
      endLen = builtins.stringLength (builtins.toString end);
      
      # Calculate 10^n efficiently
      pow10 = n: builtins.foldl' (a: _: a * 10) 1 (builtins.genList (x: x) n);
      
      # Generate numbers with specific total length and chunk size
      generateForPattern = totalDigits: chunkSize:
        let
          reps = totalDigits / chunkSize;
          isValid = (totalDigits - reps * chunkSize) == 0 && chunkSize * 2 <= totalDigits;
        in
        if !isValid then []
        else
          let
            # Calculate multiplier for repeating: e.g., for 3 reps of 2 digits: 10^4 + 10^2 + 1
            calcMultiplier = 
              let terms = builtins.genList (i: pow10 (i * chunkSize)) reps;
              in builtins.foldl' builtins.add 0 terms;
            
            multiplier = calcMultiplier;
            chunkMin = pow10 (chunkSize - 1);
            chunkMax = pow10 chunkSize - 1;
            
            makeNum = chunk: chunk * multiplier;
            
            minVal = makeNum chunkMin;
            maxVal = makeNum chunkMax;
            
            # Calculate actual range
            actualMin = if minVal < start then
                          let c = (start + multiplier - 1) / multiplier; 
                          in if c > chunkMax then chunkMax + 1 else if c < chunkMin then chunkMin else c
                        else chunkMin;
            actualMax = if maxVal > end then
                          end / multiplier
                        else chunkMax;
            
            count = if actualMax >= actualMin then actualMax - actualMin + 1 else 0;
            nums = if count > 0 then builtins.genList (i: makeNum (actualMin + i)) count else [];
            filtered = builtins.filter (n: n >= start && n <= end) nums;
          in filtered;
      
      # For each digit count, try all valid chunk sizes
      generateForDigits = numDigits:
        let
          maxChunk = numDigits / 2;
          validChunks = builtins.filter 
            (c: (numDigits - numDigits / c * c) == 0) 
            (builtins.genList (i: i + 1) maxChunk);
        in builtins.concatMap (c: generateForPattern numDigits c) validChunks;
      
      allDigits = builtins.genList (d: startLen + d) (endLen - startLen + 1);
      allNums = builtins.concatLists (map generateForDigits allDigits);
      
      # Remove duplicates efficiently using sort
      sorted = builtins.sort (a: b: a < b) allNums;
      dedupe = builtins.foldl' 
        (acc: n: if acc.prev == n then acc else { prev = n; list = acc.list ++ [n]; })
        { prev = -1; list = []; }
        sorted;
    in dedupe.list;
  
  part1 =
    let
      processRange = acc: r:
        let nums = generateEqualHalves r.start r.end;
        in acc + builtins.foldl' builtins.add 0 nums;
    in builtins.foldl' processRange 0 ranges;
  
  part2 =
    let
      processRange = acc: r:
        let nums = generateRepeating r.start r.end;
        in acc + builtins.foldl' builtins.add 0 nums;
    in builtins.foldl' processRange 0 ranges;

in {
  inherit part1 part2;
}
