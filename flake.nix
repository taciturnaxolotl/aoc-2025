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
        
        # Run a specific day's solution
        runDay = day: lang: ''
          if [ "$lang" = "ts" ] && [ -f "ts/${day}/index.ts" ]; then
            ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" --margin "1 0" "Day ${day} (TypeScript)"
            (cd ts/${day} && ${pkgs.bun}/bin/bun run index.ts)
          elif [ "$lang" = "nix" ] && [ -f "nix/${day}/solution.nix" ]; then
            ${gum}/bin/gum style --border rounded --border-foreground 212 --padding "0 1" --margin "1 0" "Day ${day} (Nix)"
            result=$(${pkgs.nix}/bin/nix-instantiate --eval --strict --json nix/${day}/solution.nix)
            part1=$(echo "$result" | ${pkgs.jq}/bin/jq -r '.part1')
            part2=$(echo "$result" | ${pkgs.jq}/bin/jq -r '.part2')
            echo "part 1: $part1"
            echo "part 2: $part2"
          fi
        '';
        
        # Interactive runner with gum
        runner = pkgs.writeShellScriptBin "aoc" ''
          set -e
          
          ${gum}/bin/gum style \
            --border double \
            --border-foreground 212 \
            --padding "1 2" \
            --margin "1 0" \
            "$(${gum}/bin/gum style --foreground 212 '🎄 Advent of Code 2025 🎄')"
          
          # Choose action
          action=$(${gum}/bin/gum choose "Run specific day" "Run all solutions" "Exit")
          
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
