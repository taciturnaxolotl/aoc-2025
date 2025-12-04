let
  input = builtins.readFile ../../shared/04/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  # Parse input into grid of booleans (true = @, false = .)
  paperMap = builtins.map (line:
    let
      len = builtins.stringLength line;
      indices = builtins.genList (i: i) len;
    in builtins.map (i:
      let ch = builtins.substring i 1 line;
      in if ch == "@" then true else false
    ) indices
  ) lines;
  
  # Count accessible papers and return new map
  accessiblePapers = map:
    let
      numRows = builtins.length map;
      
      # Process all cells in one pass using foldl'
      result = builtins.foldl' (state: rowIdx:
        let
          rowData = builtins.elemAt map rowIdx;
          numCols = builtins.length rowData;
          
          rowResult = builtins.foldl' (rowState: colIdx:
            let
              cell = builtins.elemAt rowData colIdx;
            in
              if !cell then {
                accessible = rowState.accessible;
                newRow = rowState.newRow ++ [false];
              }
              else
                let
                  # Check all 8 neighbors inline
                  check = r: c:
                    if r < 0 || c < 0 || r >= numRows then false
                    else
                      let rd = builtins.elemAt map r;
                      in if c >= builtins.length rd then false
                         else builtins.elemAt rd c;
                  
                  fullAdj = 
                    (if check (rowIdx - 1) colIdx then 1 else 0) +
                    (if check (rowIdx + 1) colIdx then 1 else 0) +
                    (if check rowIdx (colIdx + 1) then 1 else 0) +
                    (if check rowIdx (colIdx - 1) then 1 else 0) +
                    (if check (rowIdx - 1) (colIdx + 1) then 1 else 0) +
                    (if check (rowIdx + 1) (colIdx + 1) then 1 else 0) +
                    (if check (rowIdx - 1) (colIdx - 1) then 1 else 0) +
                    (if check (rowIdx + 1) (colIdx - 1) then 1 else 0);
                  
                  isAccessible = fullAdj < 4;
                in {
                  accessible = rowState.accessible + (if isAccessible then 1 else 0);
                  newRow = rowState.newRow ++ [(if isAccessible then false else true)];
                }
          ) { accessible = 0; newRow = []; } (builtins.genList (i: i) numCols);
        in {
          accessible = state.accessible + rowResult.accessible;
          newMap = state.newMap ++ [rowResult.newRow];
        }
      ) { accessible = 0; newMap = []; } (builtins.genList (i: i) numRows);
    in result;
  
  # Part 1: Single iteration
  part1 = (accessiblePapers paperMap).accessible;
  
  # Part 2: Iterate until no more accessible papers
  part2 =
    let
      iterate = state:
        let
          result = accessiblePapers state.map;
        in
          if result.accessible == 0 then state.total
          else iterate {
            map = result.newMap;
            total = state.total + result.accessible;
          };
    in iterate { map = paperMap; total = 0; };

in {
  inherit part1 part2;
}
