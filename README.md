# Advent of Code 2025 - Kieran's way

![made with vhs](https://vhs.charm.sh/vhs-4Iru9nKzVVROVumbtUEW20.gif)

This contains my solutions to advent of code 2025 in mostly `ts` or `nix` depending on how lazy I'm feeling that day.

## Running Solutions

Either you can run the days manually or you can use direnv and the `aoc` tui I made!

```bash
echo "use flake" >> .envrc && direnv allow
```

the rather boring manual way:

```bash
cd ts/01 && bun run index.ts
nix-instantiate --eval --strict nix/01/solution.nix
```

The main repo is [the tangled repo](https://tangled.org/dunkirk.sh/aoc-2025) and the github is just a mirror.

<p align="center">
	<img src="https://raw.githubusercontent.com/taciturnaxolotl/carriage/master/.github/images/line-break.svg" />
</p>

<p align="center">
	&copy 2025-present <a href="https://github.com/taciturnaxolotl">Kieran Klukas</a>
</p>

<p align="center">
	<a href="https://github.com/taciturnaxolotl/aoc-2025/blob/main/LICENSE.md"><img src="https://img.shields.io/static/v1.svg?style=for-the-badge&label=License&message=MIT&logoColor=d9e0ee&colorA=363a4f&colorB=b7bdf8"/></a>
</p>
