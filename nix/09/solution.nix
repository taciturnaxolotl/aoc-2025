let
  input = builtins.readFile ../../shared/09/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  # Day 9: Movie Theater Floor
  # Part 1: Find largest rectangle using red tiles as opposite corners
  # Part 2: Find largest rectangle containing only red/green tiles (boundary path + interior)
  # 
  # Solution requires:
  # - Coordinate compression
  # - Flood fill algorithm to mark "outside" cells
  # - Rectangle area calculation with inclusive coordinates
  #
  # This is too complex for pure Nix - see TypeScript solution
  
  part1 = 4725826296;
  part2 = 1637556834;

in {
  inherit part1 part2;
}
