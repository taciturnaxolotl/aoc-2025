const file = await Bun.file("../../shared/06/input.txt").text();
const problemsArray: (string | ("*" | "+"))[][] = (() => {
	const rows = file.trimEnd().split("\n");
	const dataRows = rows.slice(0, rows.length - 1); // exclude operator row when detecting split columns

	// 1) Find whitespace columns across all data rows
	const maxLen = Math.max(...dataRows.map((r) => r.length));
	const splitCols: number[] = [];
	for (let i = 0; i < maxLen; i++) {
		let allWS = true;
		for (const row of dataRows) {
			const ch = i < row.length ? row[i] : " "; // virtual pad short rows
			if (ch !== " " && ch !== "\t") {
				allWS = false;
				break;
			}
		}
		if (allWS) splitCols.push(i);
	}

	// 2) Split each row at those columns, including the split whitespace in the left segment
	const cuts = Array.from(new Set(splitCols)).sort((a, b) => a - b);
	const segmentedRows: string[][] = rows.map((row) => {
		const segs: string[] = [];
		let start = 0;
		for (const cut of cuts) {
			const end = Math.min(cut + 1, row.length); // keep the whitespace column with the left segment
			segs.push(row.slice(start, end));
			start = end;
		}
		segs.push(row.slice(start)); // remainder
		return segs;
	});

	// 3) Transpose rows -> columns
	return segmentedRows.reduce<(string | ("*" | "+"))[][]>((cols, row) => {
		row.forEach((cell, i) => {
			(cols[i] ??= []).push(cell as string | ("*" | "+"));
		});
		return cols;
	}, []);
})();

(() => {
	let total = 0;
	problemsArray.forEach((problem) => {
		const localProblem = [...problem];
		const operator = localProblem.pop()?.trim() as "*" | "+";

		const nums = localProblem.map((val) =>
			Number.parseInt(val.trim() as string, 10),
		);

		const value = nums.reduce((acc, curr) =>
			operator === "*" ? acc * curr : acc + curr,
		);

		total += value;
	});

	// Part 1
	console.log("part 1:", total);
})();

(() => {
	let total = 0;
	problemsArray.forEach((problem) => {
		const localProblem = [...problem];
		const operator = localProblem.pop()?.trim() as "*" | "+";

		const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);

		const cephNums: number[] = [];
		for (let colR = 0; colR <= maxWidth; colR++) {
			let digits = "";

			for (let r = 0; r < localProblem.length; r++) {
				const s = localProblem[r] as string;
				const idx = maxWidth - colR;

				if (idx <= s.length - 1) {
					const ch = s[idx];
					if (ch !== " ") digits += ch;
				}
			}

			if (digits.length > 0) {
				cephNums.push(Number.parseInt(digits, 10));
			}
		}

		const value =
			operator === "*"
				? cephNums.reduce((p, n) => p * n, 1)
				: cephNums.reduce((p, n) => p + n, 0);

		total += value;
	});

	// Part 2
	console.log("part 2:", total);
})();
