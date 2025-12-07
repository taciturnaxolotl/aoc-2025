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
		.speed-control {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 13px;
			color: #a6adc8;
		}
		.speed-control input[type="range"] {
			width: 120px;
			height: 6px;
			background: #313244;
			outline: none;
			-webkit-appearance: none;
		}
		.speed-control input[type="range"]::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 14px;
			height: 14px;
			background: #a6e3a1;
			cursor: pointer;
			border: 1px solid #313244;
		}
		.speed-control input[type="range"]::-moz-range-thumb {
			width: 14px;
			height: 14px;
			background: #a6e3a1;
			cursor: pointer;
			border: 1px solid #313244;
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
		<div class="speed-control">
			<label for="speed">Speed:</label>
			<input type="range" id="speed" min="1" max="25" value="5" step="1">
			<span id="speedValue">5x</span>
		</div>
	</div>

	<div class="info" id="infoBar">
		Group: <span id="groupNum">1</span> / <span id="totalGroups">100</span>
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
		
		// Calculate group size based on how many cards fit in a row
		function calculateGroupSize() {
			const containerWidth = window.innerWidth * 0.95; // 95vw max
			const cardMinWidth = 150; // minmax(150px, 1fr)
			const gap = 15;
			const containerPadding = 40; // 20px on each side
			
			const availableWidth = containerWidth - containerPadding;
			const cardsPerRow = Math.floor((availableWidth + gap) / (cardMinWidth + gap));
			
			// Calculate rows that fit on screen (approximate)
			const viewportHeight = window.innerHeight;
			const headerHeight = 300; // Approximate space for header, controls, info
			const availableHeight = viewportHeight - headerHeight;
			const cardHeight = 150; // Approximate card height
			const rowsPerScreen = Math.max(1, Math.floor((availableHeight + gap) / (cardHeight + gap)));
			
			return Math.max(cardsPerRow, cardsPerRow * rowsPerScreen);
		}
		
		let GROUP_SIZE = calculateGroupSize();
		let totalGroups = Math.ceil(problems.length / GROUP_SIZE);
		
		let currentGroup = 0;
		let isPart2 = false;
		let isPlaying = false;
		let shouldStop = false;
		let runningTotal = 0;
		let speed = 5;
		
		// Step state for fine-grained navigation
		let currentProblemIdx = 0; // Which problem in the group (0-9)
		let currentStepIdx = 0;    // Which number/column within that problem
		let problemAccumulators = []; // Track accumulator for each problem
		let problemData = []; // Calculated data for each problem in group

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
		const speedSlider = document.getElementById('speed');
		const speedValue = document.getElementById('speedValue');

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
			
			// Reset step state
			currentProblemIdx = 0;
			currentStepIdx = 0;
			problemAccumulators = [];
			problemData = [];
			
			groupProblems.forEach((problem, i) => {
				const item = document.createElement('div');
				item.className = 'problem-item';
				item.id = \`problem-\${i}\`;

				const localProblem = [...problem];
				const operator = localProblem.pop()?.trim();
				const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);

				// Calculate and store problem data
				const data = calculateProblemData(problem);
				problemData.push(data);
				problemAccumulators.push(operator === '*' ? 1 : 0);

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
			updateButtons();
		}

		function updateButtons() {
			const atStart = currentGroup === 0 && currentProblemIdx === 0 && currentStepIdx === 0;
			const atEnd = currentGroup === totalGroups - 1 && 
			              currentProblemIdx === problemData.length - 1 && 
			              currentStepIdx === problemData[currentProblemIdx]?.nums.length;
			
			prevBtn.disabled = isPlaying || atStart;
			nextBtn.disabled = isPlaying || atEnd;
		}

		function performStep(problemIdx, stepIdx) {
			const data = problemData[problemIdx];
			const { nums, operator } = data;
			const grid = document.getElementById(\`grid-\${problemIdx}\`);
			const acc = document.getElementById(\`acc-\${problemIdx}\`);
			
			if (!grid || !acc || stepIdx >= nums.length) return;

			const startIdx = currentGroup * GROUP_SIZE;
			const problem = problems[startIdx + problemIdx];
			
			if (isPart2) {
				// Part 2: Highlight columns
				const localProblem = [...problem];
				localProblem.pop(); // Remove operator
				const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);
				const colIdx = maxWidth - 2 - stepIdx;
				
				// Highlight all digits in this column
				const digitsInCol = grid.querySelectorAll(\`[data-col="\${colIdx}"]\`);
				digitsInCol.forEach(d => d.classList.add('highlight'));
			} else {
				// Part 1: Highlight rows
				const numberElements = grid.querySelectorAll('.number');
				if (numberElements[stepIdx]) {
					numberElements[stepIdx].classList.add('highlight');
				}
			}

			// Perform operation
			if (operator === '*') {
				problemAccumulators[problemIdx] *= nums[stepIdx];
			} else {
				problemAccumulators[problemIdx] += nums[stepIdx];
			}
			acc.textContent = problemAccumulators[problemIdx].toLocaleString();
		}

		function fadeStep(problemIdx, stepIdx) {
			const grid = document.getElementById(\`grid-\${problemIdx}\`);
			if (!grid) return;

			const startIdx = currentGroup * GROUP_SIZE;
			const problem = problems[startIdx + problemIdx];
			
			if (isPart2) {
				const localProblem = [...problem];
				localProblem.pop();
				const maxWidth = localProblem.reduce((m, s) => Math.max(m, s.length), 0);
				const colIdx = maxWidth - 2 - stepIdx;
				
				const digitsInCol = grid.querySelectorAll(\`[data-col="\${colIdx}"]\`);
				digitsInCol.forEach(d => {
					d.classList.remove('highlight');
					d.classList.add('fade');
				});
			} else {
				const numberElements = grid.querySelectorAll('.number');
				if (numberElements[stepIdx]) {
					numberElements[stepIdx].classList.remove('highlight');
					numberElements[stepIdx].classList.add('fade');
				}
			}
		}

		function stepForward(fromPlayback = false) {
			if (isPlaying && !fromPlayback) return;
			
			// Perform current step
			performStep(currentProblemIdx, currentStepIdx);
			
			// Advance step
			currentStepIdx++;
			
			// Check if we've finished this problem
			if (currentStepIdx >= problemData[currentProblemIdx].nums.length) {
				// Fade the last step
				fadeStep(currentProblemIdx, currentStepIdx - 1);
				
				// Update grand total
				runningTotal += problemAccumulators[currentProblemIdx];
				grandTotalEl.textContent = runningTotal.toLocaleString();
				
				// Move to next problem
				currentProblemIdx++;
				currentStepIdx = 0;
				
				// Check if we've finished the group
				if (currentProblemIdx >= problemData.length) {
					// Update group total
					const groupTotal = problemAccumulators.reduce((sum, val) => sum + val, 0);
					calculation.innerHTML = \`<span class="nums">Group Total: <span class="result">\${groupTotal.toLocaleString()}</span></span>\`;
					
					// Move to next group
					if (currentGroup < totalGroups - 1) {
						currentGroup++;
						renderGroup();
					}
				}
			} else {
				// Fade previous step
				if (currentStepIdx > 0) {
					fadeStep(currentProblemIdx, currentStepIdx - 1);
				}
			}
			
			if (!fromPlayback) updateButtons();
		}

		function stepBackward() {
			if (isPlaying) return;
			
			// Move back one step
			currentStepIdx--;
			
			// If we're before the start of this problem, go to previous problem
			if (currentStepIdx < 0) {
				currentProblemIdx--;
				
				// If we're before the start of the group, go to previous group
				if (currentProblemIdx < 0) {
					if (currentGroup > 0) {
						currentGroup--;
						renderGroup();
						// Set to end of this group
						currentProblemIdx = problemData.length - 1;
						currentStepIdx = problemData[currentProblemIdx].nums.length - 1;
					} else {
						// Already at the very start
						currentProblemIdx = 0;
						currentStepIdx = 0;
					}
				} else {
					// Go to end of previous problem
					currentStepIdx = problemData[currentProblemIdx].nums.length - 1;
					
					// Revert the grand total
					runningTotal -= problemAccumulators[currentProblemIdx + 1];
					grandTotalEl.textContent = runningTotal.toLocaleString();
				}
			}
			
			// Clear current state and rebuild up to current step
			renderGroupState();
			updateButtons();
		}

		function renderGroupState() {
			// Re-render the group with current state
			const startIdx = currentGroup * GROUP_SIZE;
			const endIdx = Math.min(startIdx + GROUP_SIZE, problems.length);
			const groupProblems = problems.slice(startIdx, endIdx);
			
			// Reset accumulators
			for (let i = 0; i < problemAccumulators.length; i++) {
				const data = problemData[i];
				problemAccumulators[i] = data.operator === '*' ? 1 : 0;
				const acc = document.getElementById(\`acc-\${i}\`);
				if (acc) acc.textContent = '';
			}
			
			// Clear all highlights and fades
			document.querySelectorAll('.highlight, .fade').forEach(el => {
				el.classList.remove('highlight', 'fade');
			});
			
			// Replay all steps up to current position
			for (let p = 0; p <= currentProblemIdx; p++) {
				const maxStep = p === currentProblemIdx ? currentStepIdx : problemData[p].nums.length;
				for (let s = 0; s < maxStep; s++) {
					performStep(p, s);
					fadeStep(p, s);
				}
			}
		}

		async function playAll() {
			isPlaying = true;
			shouldStop = false;
			playBtn.textContent = '⏸ Pause';
			updateButtons();

			while (!shouldStop) {
				// Check if we're at the end
				const atEnd = currentGroup === totalGroups - 1 && 
				              currentProblemIdx === problemData.length - 1 && 
				              currentStepIdx >= problemData[currentProblemIdx].nums.length;
				
				if (atEnd) break;
				
				stepForward(true);
				// Speed: 1 = 1000ms, 5 = 600ms, 10 = 200ms, 25 = 20ms
				const delay = Math.max(20, 1050 - (speed * 50));
				await new Promise(resolve => setTimeout(resolve, delay));
			}

			isPlaying = false;
			shouldStop = false;
			playBtn.textContent = '▶ Play';
			updateButtons();
		}

		function stopPlaying() {
			shouldStop = true;
			isPlaying = false;
			playBtn.textContent = '▶ Play';
			updateButtons();
		}

		function resetAnimation() {
			if (isPlaying) stopPlaying();
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
			stepBackward();
		});

		nextBtn.addEventListener('click', () => {
			stepForward();
		});

		resetBtn.addEventListener('click', resetAnimation);

		playBtn.addEventListener('click', () => {
			if (isPlaying) {
				stopPlaying();
			} else {
				playAll();
			}
		});

		speedSlider.addEventListener('input', (e) => {
			speed = parseInt(e.target.value);
			speedValue.textContent = speed + 'x';
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft') prevBtn.click();
			if (e.key === 'ArrowRight') nextBtn.click();
			if (e.key === ' ') {
				e.preventDefault();
				playBtn.click();
			}
			if (e.key === 'r' || e.key === 'R') {
				if (!isPlaying) resetBtn.click();
			}
			if (e.key === 't' || e.key === 'T') {
				if (!isPlaying) toggleMode();
			}
		});

		// Handle window resize
		window.addEventListener('resize', () => {
			const newGroupSize = calculateGroupSize();
			if (newGroupSize !== GROUP_SIZE && !isPlaying) {
				GROUP_SIZE = newGroupSize;
				totalGroups = Math.ceil(problems.length / GROUP_SIZE);
				// Adjust current group to maintain position
				const currentProblemGlobal = currentGroup * GROUP_SIZE + currentProblemIdx;
				currentGroup = Math.floor(currentProblemGlobal / GROUP_SIZE);
				currentProblemIdx = currentProblemGlobal % GROUP_SIZE;
				totalGroupsEl.textContent = totalGroups;
				renderGroup();
			}
		});

		updateModeLabels();
		renderGroup();
	</script>
</body>
</html>`;

await Bun.write(`${scriptDir}/index.html`, html);
console.log("Generated index.html with", problemsArray.length, "problems");
