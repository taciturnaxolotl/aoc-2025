let
  input = builtins.readFile ../../shared/01/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  mod = a: b: a - (a / b) * b;
  
  part1 = 
    let
      processLine = state: line:
        let
          dir = builtins.substring 0 1 line == "R";
          num = builtins.fromJSON (builtins.substring 1 (builtins.stringLength line - 1) line);
          newDial = mod (if dir then state.dial + num else state.dial - num + 100) 100;
        in {
          dial = newDial;
          count = state.count + (if newDial == 0 then 1 else 0);
        };
      
      result = builtins.foldl' processLine { dial = 50; count = 0; } lines;
    in result.count;
  
  part2 =
    let
      processLine = state: line:
        let
          dir = builtins.substring 0 1 line;
          num = builtins.fromJSON (builtins.substring 1 (builtins.stringLength line - 1) line);
          dialBefore = state.dial;
          
          distToZero = 
            let raw = if dir == "R" then mod (100 - dialBefore) 100 else mod dialBefore 100;
            in if raw == 0 then 100 else raw;
          
          passCount = if num >= distToZero then 1 + (num - distToZero) / 100 else 0;
          
          newDial = 
            let d = if dir == "R" 
                    then mod (dialBefore + num) 100 
                    else mod (100 + dialBefore - (mod num 100)) 100;
            in mod (100 + d) 100;
        in {
          dial = newDial;
          count = state.count + passCount;
        };
      
      result = builtins.foldl' processLine { dial = 50; count = 0; } lines;
    in result.count;

in {
  inherit part1 part2;
}
