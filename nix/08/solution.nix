let
  input = builtins.readFile ../../shared/08/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  part1 = 0;
  part2 = 0;

in {
  inherit part1 part2;
}
