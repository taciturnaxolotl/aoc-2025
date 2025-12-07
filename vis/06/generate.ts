const scriptDir = import.meta.dir;
const file = await Bun.file(`${scriptDir}/../../shared/06/input.txt`).text();

const problemsArray: (string | ("*" | "+"))[][] = (() => {
	const rows = file.trimEnd().split("\n");
	const dataRows = rows.slice(0, rows.length - 1);

	const maxLen = Math.max(...dataRows.map((r) => r.length));
	const splitCols: number[] = [];
	for (let i = 0; i < maxLen; i++) {
		let allWS = true;
		for (const row of dataRows) {
			const ch = i < row.length ? row[i] : " ";
			if (ch !== " " && ch !== "\t") {
				allWS = false;
				break;
			}
		}
		if (allWS) splitCols.push(i);
	}

	const cuts = Array.from(new Set(splitCols)).sort((a, b) => a - b);
	const segmentedRows: string[][] = rows.map((row) => {
		const segs: string[] = [];
		let start = 0;
		for (const cut of cuts) {
			const end = Math.min(cut + 1, row.length);
			segs.push(row.slice(start, end));
			start = end;
		}
		segs.push(row.slice(start));
		return segs;
	});

	return segmentedRows.reduce<(string | ("*" | "+"))[][]>((cols, row) => {
		row.forEach((cell, i) => {
			(cols[i] ??= []).push(cell as string | ("*" | "+"));
		});
		return cols;
	}, []);
})();

// Generate HTML with visualization
const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AoC 2025 Day 6 - Cephalopod Math</title>
	<style>
		* {
			box-sizing: border-box;
		}
		body {
			background: #1e1e2e;
			color: #cdd6f4;
			font-family: "Source Code Pro", monospace;
			font-size: 14pt;
			font-weight: 300;
			padding: 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			min-height: 100vh;
			margin: 0;
		}
		a {
			text-decoration: none;
			color: #a6e3a1;
			outline: 0;
		}
		a:hover, a:focus {
			background-color: #181825 !important;
		}
		h1 {
			color: #a6e3a1;
			text-shadow: 0 0 2px #a6e3a1, 0 0 5px #a6e3a1;
			margin-bottom: 10px;
			font-size: 1em;
			font-weight: normal;
		}
		.mode-toggle {
			display: flex;
			align-items: center;
			gap: 0;
			margin: 10px 0;
			border: 1px solid #313244;
			background: #11111b;
		}
		.mode-toggle label {
			cursor: pointer;
			padding: 8px 16px;
			font-size: 14px;
			transition: all 0.2s ease;
			border-right: 1px solid #313244;
		}
		.mode-toggle label:last-child {
			border-right: none;
		}
		.mode-toggle label.active {
			background: #313244;
			color: #a6e3a1;
		}
		.description {
			color: #a6adc8;
			font-size: 13px;
			margin: 10px 0;
			text-align: center;
			max-width: 600px;
		}
		.controls {
			margin: 15px 0;
			display: flex;
			gap: 10px;
			align-items: center;
			flex-wrap: wrap;
			justify-content: center;
		}
		button {
			background: #11111b;
			color: #a6e3a1;
			border: 1px solid #313244;
			padding: 8px 16px;
			cursor: pointer;
			font-family: inherit;
			font-size: 14px;
		}
		button:hover {
			background: #181825;
		}
		button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.info {
			color: #f9e2af;
			font-size: 14px;
			margin: 10px 0;
		}
		.problem-container {
			background: #11111b;
			padding: 20px;
			border: 2px solid #313244;
			border-radius: 4px;
			margin: 20px 0;
			max-width: 95vw;
			overflow-x: auto;
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 15px;
			align-items: start;
		}
		.problem-item {
			background: #181825;
			padding: 15px;
			border: 1px solid #313244;
			border-radius: 4px;
			position: relative;
			min-height: 120px;
		}
		.problem-item.animating {
			background: #a6e3a1;
			color: #1e1e2e;
		}
		.problem-grid {
			font-family: "Source Code Pro", monospace;
			font-size: 14px;
			line-height: 1.6;
			white-space: pre;
		}
		.problem-grid .row {
			display: block;
		}
		.problem-grid .digit {
			display: inline-block;
			transition: all 0.3s ease;
			min-width: 0.6em;
			text-align: center;
		}
		.problem-grid .digit.highlight:not(.space) {
			background: #a6e3a1;
			color: #1e1e2e;
			font-weight: bold;
		}
		.problem-grid .digit.fade {
			opacity: 0.3;
		}
		.problem-grid .number {
			display: block;
			transition: all 0.3s ease;
		}
		.problem-grid .number.highlight {
			background: #a6e3a1;
			color: #1e1e2e;
			font-weight: bold;
		}
		.problem-grid .number.fade {
			opacity: 0.3;
		}
		.problem-grid .operator {
			color: #fab387;
			font-weight: bold;
		}
		.accumulator {
			margin-top: 10px;
			padding-top: 10px;
			border-top: 2px solid #313244;
			font-weight: bold;
			color: #f9e2af;
			text-align: center;
			font-size: 16px;
		}
		.stats {
			margin-top: 20px;
			color: #a6adc8;
			text-align: center;
			font-size: 13px;
		}
		.footer {
			margin-top: 20px;
			color: #a6adc8;
			text-align: center;
			font-size: 12px;
		}
		.calculation {
			margin-bottom: 10px;
			color: #cdd6f4;
			font-size: 14px;
			text-align: center;
		}
		.calculation .nums {
			color: #a6e3a1;
			font-weight: bold;
		}
		.calculation .op {
			color: #fab387;
			font-weight: bold;
		}
		.calculation .result {
			color: #f9e2af;
			font-weight: bold;
		}
	</style>
</head>
<body>
	<h1>AoC 2025 Day 6 - Cephalopod Math</h1>

	<div class="mode-toggle">
		<label id="part1Label">Part 1: Human Reading</label>
		<label id="part2Label">Part 2: Cephalopod Reading</label>
	</div>

	<div class="description" id="description">
		Read numbers vertically down each column
	</div>

	<div class="controls">
		<button id="prev">← Previous</button>
		<button id="play">▶ Play</button>
		<button id="next">Next →</button>
		<button id="reset">↺ Reset</button>
	</div>

	<div class="info" id="infoBar">
		Group: <span id="groupNum">1</span> / <span id="totalGroups">${Math.ceil(problemsArray.length / 10)}</span>
		| Grand Total: <span id="grandTotal">0</span>
	</div>

	<div class="problem-container" id="problemContainer"></div>

	<div class="calculation" id="calculation"></div>

	<div class="stats" id="statsBar">
		Total problems: ${problemsArray.length}
	</div>

	<div class="footer">
		<a href="../index.html">[Return to Index]</a>
	</div>

	<script>
		const problems = ${JSON.stringify(problemsArray)};
		const GROUP_SIZE = 10;
		const totalGroups = Math.ceil(problems.length / GROUP_SIZE);
		
		let currentGroup = 0;
		let isPart2 = false;
		let isPlaying = false;
		let shouldStop = false;
		let runningTotal = 0;

		const groupNumEl = document.getElementById('groupNum');
		const totalGroupsEl = document.getElementById('totalGroups');
		const grandTotalEl = document.getElementById('grandTotal');
		const part1Label = document.getElementById('part1Label');
		const part2Label = document.getElementById('part2Label');
		const description = document.getElementById('description');
		const prevBtn = document.getElementById('prev');
		const nextBtn = document.getElementById('next');
		const playBtn = document.getElementById('play');
		const resetBtn = document.getElementById('reset');
		const problemContainer = document.getElementById('problemContainer');
		const calculation = document.getElementById('calculation');

		function updateModeLabels() {
			part1Label.classList.toggle('active', !isPart2);
			part2Label.classList.toggle('active', isPart2);
			if (isPart2) {
				description.textContent = 'Read digits column by column from right to left';
			} else {
				description.textContent = 'Read numbers vertically down each column';
			}
		}

		function calculateProblemData(problem) {
			const localProblem = [...problem];
			const operator = localProblem.pop()?.trim();
			const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);

			let nums;
			if (isPart2) {
				const cephNums = [];
				for (let colR = 0; colR < maxWidth; colR++) {
					let digits = "";
					for (let r = 0; r < localProblem.length; r++) {
						const s = localProblem[r];
						const idx = maxWidth - 1 - colR;
						if (idx >= 0 && idx < s.length) {
							const ch = s[idx];
							if (ch !== " ") digits += ch;
						}
					}
					if (digits.length > 0) {
						cephNums.push(parseInt(digits, 10));
					}
				}
				nums = cephNums;
			} else {
				nums = localProblem.map((val) => parseInt(val.trim(), 10));
			}
			return { nums, operator };
		}

		function renderGroup() {
			const startIdx = currentGroup * GROUP_SIZE;
			const endIdx = Math.min(startIdx + GROUP_SIZE, problems.length);
			const groupProblems = problems.slice(startIdx, endIdx);

			problemContainer.innerHTML = '';
			calculation.innerHTML = '<span class="nums">Group Total: <span class="result">0</span></span>';
			
			groupProblems.forEach((problem, i) => {
				const item = document.createElement('div');
				item.className = 'problem-item';
				item.id = \`problem-\${i}\`;

				const localProblem = [...problem];
				const operator = localProblem.pop()?.trim();
				const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);

				let gridHtml = '<div class="problem-grid" id="grid-' + i + '">';
				
				if (isPart2) {
					// For Part 2, render character by character for column highlighting
					for (let row = 0; row < localProblem.length; row++) {
						const str = localProblem[row];
						gridHtml += '<span class="row">';
						for (let col = 0; col < str.length; col++) {
							const char = str[col];
							const isSpace = char === ' ';
							gridHtml += '<span class="digit' + (isSpace ? ' space' : '') + '" data-row="' + row + '" data-col="' + col + '">' + char + '</span>';
						}
						gridHtml += '</span>';
					}
				} else {
					// For Part 1, render rows as whole numbers
					for (let row = 0; row < localProblem.length; row++) {
						gridHtml += '<span class="row number" data-row="' + row + '">' + localProblem[row] + '</span>';
					}
				}
				
				gridHtml += '<span class="operator">' + operator + '</span>';
				gridHtml += '</div>';
				gridHtml += '<div class="accumulator" id="acc-' + i + '"></div>';

				item.innerHTML = gridHtml;
				problemContainer.appendChild(item);
			});

			groupNumEl.textContent = currentGroup + 1;
			totalGroupsEl.textContent = totalGroups;
			prevBtn.disabled = currentGroup === 0 || isPlaying;
			nextBtn.disabled = currentGroup === totalGroups - 1 || isPlaying;
		}

		async function animateProblem(problemIdx, problemData, problem) {
			const { nums, operator } = problemData;
			const grid = document.getElementById(\`grid-\${problemIdx}\`);
			const acc = document.getElementById(\`acc-\${problemIdx}\`);

			let accumulator = operator === '*' ? 1 : 0;

			if (isPart2) {
				// Part 2: Highlight columns
				const localProblem = [...problem];
				localProblem.pop(); // Remove operator
				const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);

				for (let i = 0; i < nums.length; i++) {
					// Column index: rightmost is maxWidth-1, then maxWidth-2, etc.
					const colIdx = maxWidth - 2 - i;
					
					// Highlight all digits in this column
					const digitsInCol = grid.querySelectorAll(\`[data-col="\${colIdx}"]\`);
					digitsInCol.forEach(d => d.classList.add('highlight'));
					
					await new Promise(resolve => setTimeout(resolve, 400));

					// Perform operation
					if (operator === '*') {
						accumulator *= nums[i];
					} else {
						accumulator += nums[i];
					}
					acc.textContent = accumulator.toLocaleString();

					// Fade out the column
					digitsInCol.forEach(d => {
						d.classList.remove('highlight');
						d.classList.add('fade');
					});

					await new Promise(resolve => setTimeout(resolve, 200));
				}
			} else {
				// Part 1: Highlight rows
				const numberElements = grid.querySelectorAll('.number');

				for (let i = 0; i < nums.length; i++) {
					// Highlight current number
					numberElements[i].classList.add('highlight');
					
					await new Promise(resolve => setTimeout(resolve, 400));

					// Perform operation
					if (operator === '*') {
						accumulator *= nums[i];
					} else {
						accumulator += nums[i];
					}
					acc.textContent = accumulator.toLocaleString();

					// Fade out the number
					numberElements[i].classList.remove('highlight');
					numberElements[i].classList.add('fade');

					await new Promise(resolve => setTimeout(resolve, 200));
				}
			}

			return accumulator;
		}

		async function animateGroup() {
			const startIdx = currentGroup * GROUP_SIZE;
			const endIdx = Math.min(startIdx + GROUP_SIZE, problems.length);
			const groupProblems = problems.slice(startIdx, endIdx);

			let groupTotal = 0;

			// Animate all problems in parallel but update totals as each completes
			const results = await Promise.all(
				groupProblems.map(async (problem, i) => {
					const data = calculateProblemData(problem);
					const result = await animateProblem(i, data, problem);
					
					// Update totals cumulatively as each problem finishes
					groupTotal += result;
					runningTotal += result;
					grandTotalEl.textContent = runningTotal.toLocaleString();
					
					return result;
				})
			);

			// Show final group total
			calculation.innerHTML = \`<span class="nums">Group Total: <span class="result">\${groupTotal.toLocaleString()}</span></span>\`;
		}

		async function playAll() {
			isPlaying = true;
			shouldStop = false;
			playBtn.textContent = '⏸ Pause';
			prevBtn.disabled = true;
			nextBtn.disabled = true;

			for (let i = currentGroup; i < totalGroups; i++) {
				if (shouldStop) break;
				
				currentGroup = i;
				renderGroup();
				await animateGroup();
				
				if (shouldStop) break;
				await new Promise(resolve => setTimeout(resolve, 1000));
			}

			isPlaying = false;
			playBtn.textContent = '▶ Play';
			prevBtn.disabled = currentGroup === 0;
			nextBtn.disabled = currentGroup === totalGroups - 1;
		}

		function stopPlaying() {
			shouldStop = true;
		}

		function resetAnimation() {
			if (isPlaying) return;
			currentGroup = 0;
			runningTotal = 0;
			grandTotalEl.textContent = '0';
			calculation.innerHTML = '';
			renderGroup();
		}

		function toggleMode() {
			if (isPlaying) return;
			isPart2 = !isPart2;
			updateModeLabels();
			resetAnimation();
		}

		part1Label.addEventListener('click', () => {
			if (isPart2 && !isPlaying) toggleMode();
		});

		part2Label.addEventListener('click', () => {
			if (!isPart2 && !isPlaying) toggleMode();
		});

		prevBtn.addEventListener('click', () => {
			if (!isPlaying && currentGroup > 0) {
				currentGroup--;
				renderGroup();
			}
		});

		nextBtn.addEventListener('click', () => {
			if (!isPlaying && currentGroup < totalGroups - 1) {
				currentGroup++;
				renderGroup();
			}
		});

		resetBtn.addEventListener('click', resetAnimation);

		playBtn.addEventListener('click', () => {
			if (isPlaying) {
				stopPlaying();
			} else {
				playAll();
			}
		});

		document.addEventListener('keydown', (e) => {
			if (isPlaying) return;
			if (e.key === 'ArrowLeft') prevBtn.click();
			if (e.key === 'ArrowRight') nextBtn.click();
			if (e.key === ' ') {
				e.preventDefault();
				playBtn.click();
			}
			if (e.key === 'r' || e.key === 'R') resetBtn.click();
			if (e.key === 't' || e.key === 'T') {
				toggleMode();
			}
		});

		updateModeLabels();
		renderGroup();
	</script>
</body>
</html>`;

await Bun.write(`${scriptDir}/index.html`, html);
console.log("Generated index.html with", problemsArray.length, "problems");
