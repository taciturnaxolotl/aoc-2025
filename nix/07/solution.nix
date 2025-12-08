let
  input = builtins.readFile ../../shared/07/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  # Parse grid into 2D array of characters
  grid = builtins.map (line: builtins.genList (i: builtins.substring i 1 line) (builtins.stringLength line)) lines;
  
  rows = builtins.length grid;
  cols = builtins.length (builtins.head grid);
  
  # Find starting position
  findStart = grid:
    let
      findInRow = rowIdx: row:
        let
          colIdx = builtins.foldl' (acc: i:
            if acc != null then acc
            else if builtins.elemAt row i == "S" then i
            else null
          ) null (builtins.genList (i: i) (builtins.length row));
        in if colIdx != null then { r = rowIdx; c = colIdx; } else null;
      
      result = builtins.foldl' (acc: i:
        if acc != null then acc
        else findInRow i (builtins.elemAt grid i)
      ) null (builtins.genList (i: i) (builtins.length grid));
    in result;
  
  startPos = findStart grid;
  
  # Check if position is in bounds
  inBounds = r: c: r >= 0 && r < rows && c >= 0 && c < cols;
  
  # Get cell at position
  getCell = r: c: 
    if inBounds r c 
    then builtins.elemAt (builtins.elemAt grid r) c
    else ".";
  
  # Part 1: Count total splits
  part1 =
    let
      # Process one step of beams
      stepBeams = state:
        let
          beams = state.beams;
          nextBeams = builtins.concatMap (beam:
            let
              r = beam.r;
              c = beam.c;
              nr = r + 1;
              nc = c;
            in
              if !inBounds nr nc then []
              else
                let cell = getCell nr nc;
                in
                  if cell == "." || cell == "S" then [{ r = nr; c = nc; }]
                  else if cell == "^" then
                    # Split into left and right
                    let
                      left = if inBounds nr (nc - 1) then [{ r = nr; c = nc - 1; }] else [];
                      right = if inBounds nr (nc + 1) then [{ r = nr; c = nc + 1; }] else [];
                    in left ++ right
                  else [{ r = nr; c = nc; }]
          ) beams;
          
          # Count splits in this step
          splits = builtins.foldl' (acc: beam:
            let
              r = beam.r;
              c = beam.c;
              nr = r + 1;
              nc = c;
              cell = if inBounds nr nc then getCell nr nc else ".";
            in if cell == "^" then acc + 1 else acc
          ) 0 beams;
          
          # Remove duplicates using string keys
          uniqueBeams = 
            let
              keysSet = builtins.foldl' (acc: beam:
                acc // { "${toString beam.r},${toString beam.c}" = beam; }
              ) {} nextBeams;
            in builtins.attrValues keysSet;
        in
          {
            beams = uniqueBeams;
            totalSplits = state.totalSplits + splits;
          };
      
      # Run simulation until no beams left
      simulate = state:
        if builtins.length state.beams == 0 
        then state.totalSplits
        else simulate (stepBeams state);
      
      initialState = {
        beams = [{ r = startPos.r; c = startPos.c; }];
        totalSplits = 0;
      };
    in simulate initialState;
  
  # Part 2: Count total timelines
  part2 =
    let
      # Helper to parse "r,c" key
      parseKey = key:
        let
          parts = builtins.match "([0-9]+),([0-9]+)" key;
        in {
          r = builtins.fromJSON (builtins.head parts);
          c = builtins.fromJSON (builtins.elemAt parts 1);
        };
      
      # Process one step with timeline counts
      stepTimelines = states:
        let
          # For each position with count, move forward
          nextStates = builtins.foldl' (acc: key:
            let
              count = builtins.getAttr key states;
              pos = parseKey key;
              r = pos.r;
              c = pos.c;
              nr = r + 1;
              nc = c;
            in
              if !inBounds nr nc then acc
              else
                let cell = getCell nr nc;
                in
                  if cell == "." || cell == "S" then
                    # Continue straight
                    let nkey = "${toString nr},${toString nc}";
                    in acc // { ${nkey} = (acc.${nkey} or 0) + count; }
                  else if cell == "^" then
                    # Split into two timelines
                    let
                      left = if inBounds nr (nc - 1) then
                        let lkey = "${toString nr},${toString (nc - 1)}";
                        in { ${lkey} = (acc.${lkey} or 0) + count; }
                      else {};
                      right = if inBounds nr (nc + 1) then
                        let rkey = "${toString nr},${toString (nc + 1)}";
                        in { ${rkey} = (acc.${rkey} or 0) + count; }
                      else {};
                    in acc // left // right
                  else
                    # Continue straight
                    let nkey = "${toString nr},${toString nc}";
                    in acc // { ${nkey} = (acc.${nkey} or 0) + count; }
          ) {} (builtins.attrNames states);
        in nextStates;
      
      # Run simulation for all rows
      simulate = states: step:
        let
          nextStates = if step >= rows then {} else stepTimelines states;
          hasStates = builtins.length (builtins.attrNames nextStates) > 0;
        in
          if step >= rows || !hasStates
          then states  # Return last valid states
          else simulate nextStates (step + 1);
      
      initialStates = { "${toString startPos.r},${toString startPos.c}" = 1; };
      finalStates = simulate initialStates 0;
      
      # Sum all timeline counts
      totalTimelines = builtins.foldl' (acc: key:
        acc + builtins.getAttr key finalStates
      ) 0 (builtins.attrNames finalStates);
    in totalTimelines;

in {
  inherit part1 part2;
}
