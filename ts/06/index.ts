const file = await Bun.file("../../shared/06/input.txt").text();
const problems: string[][] = file
	.trim()
	.split("\n")
	.map((row) => row.split(/\s+/));

const problemsArray: (number | ("*" | "+"))[][] = [];

for (let i = 0; i < (problems.at(0)?.length as number); i++) {
	const localArray: (number | ("*" | "+"))[] = [];

	for (let j = 0; j < problems.length; j++) {
		localArray.push(problems.at(j)?.at(i) as number | ("*" | "+"));
	}

	problemsArray.push(localArray);
}

(() => {
	let total = 0;
	problemsArray.forEach((problem) => {
		const operator = problem.pop() as "*" | "+";

		const nums = problem.map((val) => Number.parseInt(val as string, 10));

		total += nums.reduce((acc, curr) =>
			operator === "*" ? acc * curr : acc + curr,
		);
	});

	// Part 1
	console.log("part 1:", total);
})();

(() => {
	// Part 2
	console.log("part 2:", 0);
})();
