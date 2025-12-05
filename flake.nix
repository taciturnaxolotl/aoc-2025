{
  description = "Advent of Code 2025 Solutions";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        gum = pkgs.gum;
        
        # Get list of available days
        getDays = ''
          days=()
          for dir in ts/* nix/*; do
            if [ -d "$dir" ]; then
              day=$(basename "$dir")
              if [[ ! " ''${days[@]} " =~ " ''${day} " ]]; then
                days+=("$day")
              fi
            fi
          done
          echo "''${days[@]}" | tr ' ' '\n' | sort
        '';
        
        # Interactive runner with gum
        runner = pkgs.writeShellScriptBin "aoc" ''
          set -e
          
          # Parse flags
          day_flag=""
          lang_flag=""
          action_flag=""
          
          while [[ $# -gt 0 ]]; do
            case $1 in
              --day|-d)
                day_flag="$2"
                action_flag="run"
                shift 2
                ;;
              --lang|-l)
                lang_flag="$2"
                shift 2
                ;;
              --all|-a)
                action_flag="all"
                shift
                ;;
              --init|-i)
                action_flag="init"
                shift
                ;;
              *)
                echo "Unknown option: $1"
                echo "Usage: aoc [--day DAY] [--lang ts|nix] [--all] [--init]"
                exit 1
                ;;
            esac
          done
          
          # If running with flags, skip interactive mode
          if [ -n "$day_flag" ]; then
            # Format day with leading zero
            day=$(printf "%02d" $((10#$day_flag)))
            
            # Determine which languages to run
            run_ts=false
            run_nix=false
            
            if [ -z "$lang_flag" ] || [ "$lang_flag" = "both" ]; then
              [ -f "ts/$day/index.ts" ] && run_ts=true
              [ -f "nix/$day/solution.nix" ] && run_nix=true
            elif [ "$lang_flag" = "ts" ] || [ "$lang_flag" = "typescript" ]; then
              [ -f "ts/$day/index.ts" ] && run_ts=true
            elif [ "$lang_flag" = "nix" ]; then
              [ -f "nix/$day/solution.nix" ] && run_nix=true
            else
              echo "Unknown language: $lang_flag (use ts or nix)"
              exit 1
            fi
            
            if [ "$run_ts" = false ] && [ "$run_nix" = false ]; then
              echo "No solutions found for day $day"
              exit 1
            fi
            
            ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" "Day $day"
            echo ""
            
            if [ "$run_ts" = true ]; then
              ${gum}/bin/gum style --foreground 212 "TypeScript:"
              (cd ts/$day && ${pkgs.bun}/bin/bun run index.ts)
              echo ""
            fi
            
            if [ "$run_nix" = true ]; then
              ${gum}/bin/gum style --foreground 212 "Nix:"
              result=$(${pkgs.nix}/bin/nix-instantiate --eval --strict --json nix/$day/solution.nix)
              echo "$result" | ${pkgs.jq}/bin/jq -r 'to_entries | .[] | "\(.key): \(.value)"'
            fi
            
            exit 0
          fi
          
          # If --all flag, run all solutions
          if [ "$action_flag" = "all" ]; then
            all_days=()
            for dir in ts/* nix/*; do
              if [ -d "$dir" ]; then
                day=$(basename "$dir")
                if [[ ! " ''${all_days[@]} " =~ " ''${day} " ]]; then
                  all_days+=("$day")
                fi
              fi
            done
            
            for daynum in $(printf '%s\n' "''${all_days[@]}" | sort); do
              ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" "Day $daynum"
              echo ""
              
              if [ -f "ts/$daynum/index.ts" ]; then
                ${gum}/bin/gum style --foreground 212 "TypeScript:"
                (cd ts/$daynum && ${pkgs.bun}/bin/bun run index.ts)
                echo ""
              fi
              
              if [ -f "nix/$daynum/solution.nix" ]; then
                ${gum}/bin/gum style --foreground 212 "Nix:"
                result=$(${pkgs.nix}/bin/nix-instantiate --eval --strict --json nix/$daynum/solution.nix)
                echo "$result" | ${pkgs.jq}/bin/jq -r 'to_entries | .[] | "\(.key): \(.value)"'
                echo ""
              fi
            done
            
            exit 0
          fi
          
          # Interactive mode
          ${gum}/bin/gum style \
            --border double \
            --border-foreground 212 \
            --padding "1 2" \
            --margin "1 0" \
            "$(${gum}/bin/gum style --foreground 212 '🎄 Advent of Code 2025 🎄')"
          
          # Choose action
          if [ "$action_flag" = "init" ]; then
            action="Init new day"
          else
            action=$(${gum}/bin/gum choose "Run specific day" "Run all solutions" "Init new day" "Exit")
          fi
          
          case "$action" in
            "Run specific day")
              # Get available days
              days=$(${getDays})
              
              if [ -z "$days" ]; then
                ${gum}/bin/gum style --foreground 196 "No solutions found!"
                exit 1
              fi
              
              day=$(echo "$days" | ${gum}/bin/gum choose)
              
              # Check what languages are available for this day
              langs=()
              [ -f "ts/$day/index.ts" ] && langs+=("TypeScript")
              [ -f "nix/$day/solution.nix" ] && langs+=("Nix")
              langs+=("Both")
              
              lang=$(printf '%s\n' "''${langs[@]}" | ${gum}/bin/gum choose)
              
              echo ""
              case "$lang" in
                "TypeScript")
                  if [ -f "ts/$day/index.ts" ]; then
                    ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" "Day $day"
                    echo ""
                    ${gum}/bin/gum style --foreground 212 "TypeScript:"
                    (cd ts/$day && ${pkgs.bun}/bin/bun run index.ts)
                  fi
                  ;;
                "Nix")
                  if [ -f "nix/$day/solution.nix" ]; then
                    ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" "Day $day"
                    echo ""
                    ${gum}/bin/gum style --foreground 212 "Nix:"
                    result=$(${pkgs.nix}/bin/nix-instantiate --eval --strict --json nix/$day/solution.nix)
                    echo "$result" | ${pkgs.jq}/bin/jq -r 'to_entries | .[] | "\(.key): \(.value)"'
                  fi
                  ;;
                "Both")
                  ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" "Day $day"
                  echo ""
                  if [ -f "ts/$day/index.ts" ]; then
                    ${gum}/bin/gum style --foreground 212 "TypeScript:"
                    (cd ts/$day && ${pkgs.bun}/bin/bun run index.ts)
                    echo ""
                  fi
                  if [ -f "nix/$day/solution.nix" ]; then
                    ${gum}/bin/gum style --foreground 212 "Nix:"
                    result=$(${pkgs.nix}/bin/nix-instantiate --eval --strict --json nix/$day/solution.nix)
                    echo "$result" | ${pkgs.jq}/bin/jq -r 'to_entries | .[] | "\(.key): \(.value)"'
                  fi
                  ;;
              esac
              ;;
              
            "Run all solutions")
              # Collect all unique days
              all_days=()
              for dir in ts/* nix/*; do
                if [ -d "$dir" ]; then
                  day=$(basename "$dir")
                  if [[ ! " ''${all_days[@]} " =~ " ''${day} " ]]; then
                    all_days+=("$day")
                  fi
                fi
              done
              
              # Sort and run each day
              for daynum in $(printf '%s\n' "''${all_days[@]}" | sort); do
                ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" "Day $daynum"
                echo ""
                
                if [ -f "ts/$daynum/index.ts" ]; then
                  ${gum}/bin/gum style --foreground 212 "TypeScript:"
                  (cd ts/$daynum && ${pkgs.bun}/bin/bun run index.ts)
                  echo ""
                fi
                
                if [ -f "nix/$daynum/solution.nix" ]; then
                  ${gum}/bin/gum style --foreground 212 "Nix:"
                  result=$(${pkgs.nix}/bin/nix-instantiate --eval --strict --json nix/$daynum/solution.nix)
                  echo "$result" | ${pkgs.jq}/bin/jq -r 'to_entries | .[] | "\(.key): \(.value)"'
                  echo ""
                fi
              done
              ;;

            "Init new day")
              # Get all existing days
              all_days=()
              for dir in ts/* nix/* shared/*; do
                if [ -d "$dir" ]; then
                  day=$(basename "$dir")
                  if [[ "$day" =~ ^[0-9]+$ ]]; then
                    all_days+=("$day")
                  fi
                fi
              done
              
              # Find next day number
              next_day=01
              if [ ''${#all_days[@]} -gt 0 ]; then
                max_day=$(printf '%s\n' "''${all_days[@]}" | sort -n | tail -1)
                next_day=$(printf "%02d" $((10#$max_day + 1)))
              fi
              
              # Show form with prefilled day
              ${gum}/bin/gum style --foreground 212 "Initializing new day"
              echo ""
              
              day=$(${gum}/bin/gum input --placeholder "Day number" --value "$next_day" --prompt "Day: ")
              
              # Validate day is a number
              if ! [[ "$day" =~ ^[0-9]+$ ]]; then
                ${gum}/bin/gum style --foreground 196 "Invalid day number!"
                exit 1
              fi
              
              # Format with leading zero
              day=$(printf "%02d" $((10#$day)))
              
              # Check if day already exists
              if [ -d "ts/$day" ] || [ -d "nix/$day" ] || [ -d "shared/$day" ]; then
                ${gum}/bin/gum style --foreground 196 "Day $day already exists!"
                exit 1
              fi
              
              # Create directories
              mkdir -p "ts/$day"
              mkdir -p "nix/$day"
              mkdir -p "shared/$day"
              
              # Fetch input from adventofcode.com
              ${gum}/bin/gum style --foreground 212 "Fetching input from adventofcode.com..."
              
              # Check for session cookie
              session_cookie=""
              if [ -f ".aoc-session" ]; then
                session_cookie=$(cat .aoc-session)
              else
                ${gum}/bin/gum style --foreground 196 "No .aoc-session file found!"
                ${gum}/bin/gum style "Create .aoc-session with your session cookie from adventofcode.com"
                exit 1
              fi
              
              # Fetch input
              day_num=$((10#$day))
              ${pkgs.curl}/bin/curl -s -b "session=$session_cookie" \
                "https://adventofcode.com/2025/day/$day_num/input" \
                -o "shared/$day/input.txt"
              
              if [ $? -ne 0 ] || [ ! -s "shared/$day/input.txt" ]; then
                ${gum}/bin/gum style --foreground 196 "Failed to fetch input!"
                rm -rf "ts/$day" "nix/$day" "shared/$day"
                exit 1
              fi
              
              # Create TypeScript template
              cat > "ts/$day/index.ts" << EOF
const file = await Bun.file("../../shared/$day/input.txt").text();

(() => {
  // Part 1
  console.log("part 1:", 0);
})();

(() => {
  // Part 2
  console.log("part 2:", 0);
})();
EOF
              
              # Create Nix template
              cat > "nix/$day/solution.nix" << EOF
let
  input = builtins.readFile ../../shared/$day/input.txt;
  lines = builtins.filter (s: builtins.isString s && s != "") (builtins.split "\n" input);
  
  part1 = 0;
  part2 = 0;

in {
  inherit part1 part2;
}
EOF
              
              ${gum}/bin/gum style --foreground 212 "✓ Day $day initialized!"
              ${gum}/bin/gum style "  • ts/$day/index.ts"
              ${gum}/bin/gum style "  • nix/$day/solution.nix"
              ${gum}/bin/gum style "  • shared/$day/input.txt"
              ;;
              
            "Exit")
              ${gum}/bin/gum style --foreground 212 "Happy coding! 🎅"
              exit 0
              ;;
          esac
        '';
        
      in {
        # Development shell with all tools
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            jq
            gum
            runner
          ];
          
          shellHook = ''
            ${gum}/bin/gum style --foreground 212 "🎄 Advent of Code 2025 🎄"
            echo ""
            ${gum}/bin/gum style "Run 'aoc' to start the interactive runner"
          '';
        };
        
        # Packages
        packages = {
          default = runner;
        };
        
        # Apps
        apps = {
          default = {
            type = "app";
            program = "${runner}/bin/aoc";
          };
        };
      }
    );
}
