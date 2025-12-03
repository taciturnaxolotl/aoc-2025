const file = await Bun.file("../../shared/03/input.txt").text();
const banks = file.split("\n");

(() => {
	let jolts = 0;
	for (const bank of banks) {
		const L = bank.length;

		let highestPair = -1;
		for (let j = 1; j <= L - 1; j++) {
			let largestI = -1;
			const jVal = Number.parseInt(bank[j] as string, 10);
			for (let i = 0; i < j; i++) {
				const iVal = Number.parseInt(bank[i] as string, 10);
				if (iVal > largestI) largestI = iVal;
			}

			const pair = largestI * 10 + jVal;

			if (pair > highestPair) highestPair = pair;
		}

		jolts += highestPair;
	}

	console.log(jolts);
})();
