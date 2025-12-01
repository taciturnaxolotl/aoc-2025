const file = await Bun.file("./input.txt").text();

let dial = 50;
let count = 0;

file.split("\n").forEach((line) => {
	const dir = line.startsWith("R"); // false is left
	const num = Number.parseInt(line.substring(1), 10);

	if (dir) dial -= num;
	else dial += num;

	dial %= 100;

	if (dial === 0) count++;
});

console.log(`part 1: ${count}`);
