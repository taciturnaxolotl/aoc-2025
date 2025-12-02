const file = await Bun.file("../../shared/02/input.txt").text();

const ranges: { start: number; end: number }[] = file
	.split(",")
	.map((range) => {
		const splitRange = range.split("-");
		return {
			start: Number.parseInt(splitRange[0] as string, 10),
			end: Number.parseInt(splitRange[1] as string, 10),
		};
	});

(() => {
	let count = 0;

	ranges.forEach((range) => {
		for (let i = range.start; i <= range.end; i++) {
			const numberString = i.toString();

			if (numberString.length % 2 === 1) continue;

			const firstHalf = numberString.substring(
				0,
				(numberString.length + 1) / 2,
			);
			const secondHalf = numberString.substring(numberString.length / 2);

			if (firstHalf === secondHalf) count += i;
		}
	});

	console.log("part 1:", count);
})();

(() => {
	let count = 0;

	ranges.forEach((range) => {
		for (let i = range.start; i <= range.end; i++) {
			const numberString = i.toString();

			for (let j = 1; j <= Math.floor(numberString.length / 2); j++) {
				if (numberString.length % j !== 0) continue;

				const chunk = numberString.slice(0, j);

				let testString = "";
				for (let k = 0; k < numberString.length / j; k++) testString += chunk;
				if (testString === numberString) {
					count += i;
					break;
				}
			}
		}
	});

	console.log("part 2:", count);
})();
