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

	console.log("part 1:", jolts);
})();

(() => {
	let jolts = 0n;
	for (const bank of banks) {
		const L = bank.length;
		if (L === 0) continue;

		const K = 12;
		const joltNums: number[] = [];

		for (let j = 0; j <= L - 1; j++) {
			const jVal = Number.parseInt(bank[j] as string, 10);

			// Remaining digits including current position
			const remaining = L - j;

			// Improve prefix: pop smaller tail digits if we can still reach K after popping
			while (
				joltNums.length > 0 &&
				(joltNums[joltNums.length - 1] as number) < jVal &&
				joltNums.length - 1 + remaining >= K
			) {
				joltNums.pop();
			}

			// Take current if we still need digits
			if (joltNums.length < K) {
				joltNums.push(jVal);
			}

			// else skip
		}

		// Accumulate as BigInt
		let acc = 0n;
		for (const d of joltNums) {
			acc = acc * 10n + BigInt(d);
		}
		jolts += acc;
	}

	console.log("part 2", jolts);
})();
