const file = await Bun.file("../../shared/04/input.txt").text();
const paperMap: boolean[][] = file
	.trim()
	.split("\n")
	.map((line) =>
		Array.from(line, (ch) => {
			if (ch === ".") return false;
			if (ch === "@") return true;

			throw new Error(`Unexpected character '${ch}' in input.`);
		}),
	);

function accessiblePapers(map: boolean[][]): {
	map: boolean[][];
	accessible: number;
} {
	let accessible = 0;
	const nextMap: boolean[][] = map.map((row) => row.slice());
	map.forEach((rows, row) => {
		rows.forEach((cell, col) => {
			if (cell) {
				let fullAdj = 0;

				const offsets: { row: number; col: number }[] = [
					// cardinal
					{ row: -1, col: 0 },
					{ row: 1, col: 0 },
					{ row: 0, col: 1 },
					{ row: 0, col: -1 },
					// diagonals
					{ row: -1, col: 1 },
					{ row: 1, col: 1 },
					{ row: -1, col: -1 },
					{ row: 1, col: -1 },
				];

				for (const off of offsets) {
					const rowIdx = row + off.row;
					const colIdx = col + off.col;

					if (rowIdx < 0 || colIdx < 0) continue;
					if (rowIdx > paperMap.length - 1 || colIdx > rows.length - 1)
						continue;

					if (map.at(rowIdx)?.at(colIdx)) fullAdj++;

					if (fullAdj >= 4) break;
				}

				if (fullAdj < 4) {
					accessible++;
					(nextMap[row] as boolean[])[col] = false;
				}
			}
		});
	});

	return { map: nextMap, accessible };
}

(() => {
	// Part 1
	console.log("part 1:", accessiblePapers(paperMap).accessible);
})();

(() => {
	let totalAcessible = 0;
	let map = paperMap;
	while (true) {
		const res = accessiblePapers(map);

		totalAcessible += res.accessible;
		map = res.map;

		if (res.accessible === 0) break;
	}

	// Part 2
	console.log("part 2:", totalAcessible);
})();
