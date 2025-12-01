const file = await Bun.file("./input.txt").text();

(() => {
	let dial = 50;
	let count = 0;

	file.split("\n").forEach((line) => {
		const dir = line.startsWith("R"); // false is left
		const num = Number.parseInt(line.substring(1), 10);

		if (dir) dial += num;
		else dial -= num;

		dial %= 100;

		if (dial === 0) count++;
	});

	console.log(`part 1: ${count}`);
})();

(() => {
	let dial = 50;
	let count = 0;

	file.split("\n").forEach((line) => {
		line = line.trim();
		const dir = line[0]; // false is left
		const num = Number.parseInt(line.substring(1), 10);

		const dialBefore = dial;

		let distToZero: number;
		if (dir === "R") {
			distToZero = (100 - dialBefore) % 100;
		} else {
			distToZero = dialBefore % 100;
		}

		if (distToZero === 0) distToZero = 100;

		if (num >= distToZero) {
			count += 1 + Math.floor((num - distToZero) / 100);
		}

		if (dir === "R") dial = (dialBefore + num) % 100;
		else dial = (100 + dialBefore - (num % 100)) % 100;

		dial = (100 + dial) % 100;
	});

	console.log(`part 2: ${count}`);
})();
