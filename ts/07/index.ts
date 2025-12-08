const file = await Bun.file("../../shared/07/input.txt").text();
const board: string[][] = file
	.trimEnd()
	.split("\n")
	.map((line) => line.split(""));

type Coord = { r: number; c: number };

// Find S
const S: Coord | null = (() => {
	for (let r = 0; r < board.length; r++) {
		const c = board[r]?.indexOf("S") as number;
		if (c !== -1) return { r, c };
	}
	return null;
})();

if (!S) throw "No start position found";

const inBounds = (r: number, c: number) =>
	r >= 0 && r < board.length && c >= 0 && c < board[0].length;

// Part 1: Count unique beam positions and splits
(() => {
	type BeamPosition = [number, number];
	let activeBeams: BeamPosition[] = [[S.r, S.c]];
	let totalSplits = 0;

	while (activeBeams.length > 0) {
		const nextActive: BeamPosition[] = [];

		for (const [r, c] of activeBeams) {
			const nr = r + 1;
			const nc = c;

			if (!inBounds(nr, nc)) continue;

			const cell = board[nr][nc];

			if (cell === ".") {
				nextActive.push([nr, nc]);
			} else if (cell === "^") {
				totalSplits++;
				// Split into left and right beams
				const leftC = nc - 1;
				const rightC = nc + 1;
				if (inBounds(nr, leftC)) nextActive.push([nr, leftC]);
				if (inBounds(nr, rightC)) nextActive.push([nr, rightC]);
			} else {
				// 'S' or other chars - continue straight
				nextActive.push([nr, nc]);
			}
		}

		// Remove duplicates
		const uniqueBeams = [
			...new Set(nextActive.map(([r, c]) => `${r},${c}`)),
		].map((s) => s.split(",").map(Number) as BeamPosition);

		activeBeams = uniqueBeams;
	}

	console.log("part 1:", totalSplits);
})();

// Part 2: Count total timelines (beams multiply through splitters)
(() => {
	let currentStates: Record<string, number> = { [`${S.r},${S.c}`]: 1 };

	for (let step = 0; step < board.length; step++) {
		const nextStates: Record<string, number> = {};

		for (const [key, count] of Object.entries(currentStates)) {
			const [r, c] = key.split(",").map(Number);
			const nr = r + 1;

			if (nr >= board.length) continue;
			if (!inBounds(nr, c)) continue;

			const cell = board[nr][c];

			if (cell === ".") {
				const nkey = `${nr},${c}`;
				nextStates[nkey] = (nextStates[nkey] || 0) + count;
			} else if (cell === "^") {
				// Each timeline splits into two
				const lc = c - 1;
				const rc = c + 1;
				if (inBounds(nr, lc)) {
					const lkey = `${nr},${lc}`;
					nextStates[lkey] = (nextStates[lkey] || 0) + count;
				}
				if (inBounds(nr, rc)) {
					const rkey = `${nr},${rc}`;
					nextStates[rkey] = (nextStates[rkey] || 0) + count;
				}
			} else {
				// 'S' or other chars - continue straight
				const nkey = `${nr},${c}`;
				nextStates[nkey] = (nextStates[nkey] || 0) + count;
			}
		}

		if (Object.keys(nextStates).length === 0) break;
		currentStates = nextStates;
	}

	const totalTimelines = Object.values(currentStates).reduce(
		(a, b) => a + b,
		0,
	);
	console.log("part 2:", totalTimelines);
})();
