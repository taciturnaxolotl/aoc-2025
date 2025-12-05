const file = await Bun.file("../../shared/05/input.txt").text();
const [freshRanges, ingredients] = file
	.split("\n\n")
	.map((line) => line.split("\n"));

type Range = {
	start: number;
	end: number;
};

const parsedFreshRanges = (freshRanges as string[])
	.map((range: string) => {
		const [start, end] = range.split("-");
		return {
			start: Number.parseInt(start as string, 10),
			end: Number.parseInt(end as string, 10),
		};
	})
	.sort((a, b) => a.start - b.start) as Range[];

const mergedRanges: Range[] = [];
let current = { ...parsedFreshRanges[0] } as Range;

for (let i = 1; i < parsedFreshRanges.length; i++) {
	const next = parsedFreshRanges[i] as Range;

	// check if overlapping or adjacent
	if (current.end + 1 >= next.start) {
		if (next.end > current.end) {
			current.end = next.end;
		}
	} else {
		mergedRanges.push(current);
		current = { ...next };
	}
}

mergedRanges.push(current);

const parsedIngredients = ingredients
	?.map((incredient) => Number.parseInt(incredient, 10))
	.sort((a, b) => a - b) as number[];

(() => {
	let freshCount = 0;

	let rangeIndex = 0;
	parsedIngredients.forEach((ingredient) => {
		while (true) {
			if (rangeIndex < mergedRanges.length) {
				const range = mergedRanges.at(rangeIndex) as Range;

				if (ingredient < range.start) return;
				else if (ingredient <= range.end) {
					freshCount++;
					return;
				} else {
					rangeIndex++;
				}
			} else return;
		}
	});

	// Part 1
	console.log("part 1:", freshCount);
})();

(() => {
	// Part 2
	console.log("part 2:", 0);
})();
