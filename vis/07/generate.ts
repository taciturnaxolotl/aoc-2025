const scriptDir = import.meta.dir;
const file = await Bun.file(`${scriptDir}/../../shared/07/input.txt`).text();
const grid: string[][] = file
	.trim()
	.split("\n")
	.map((line) => Array.from(line));

const ROWS = grid.length;
const COLS = grid[0].length;

// Find starting position
let startRow = -1;
let startCol = -1;
for (let r = 0; r < ROWS; r++) {
	const c = grid[r].indexOf("S");
	if (c !== -1) {
		startRow = r;
		startCol = c;
		break;
	}
}

function inBounds(r: number, c: number): boolean {
	return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

// ============ PART 1: Track unique beam positions ============
type BeamPosition = [number, number];
type Stage1 = {
	beams: BeamPosition[];
	splitCount: number;
	totalSplits: number;
	step: number;
};

const stages1: Stage1[] = [];
let active1: BeamPosition[] = [[startRow, startCol]];
let totalSplits1 = 0;

stages1.push({
	beams: [...active1],
	splitCount: 0,
	totalSplits: 0,
	step: 0,
});

while (active1.length > 0) {
	const nextActive: BeamPosition[] = [];
	let splitThisStep = 0;

	for (const [r, c] of active1) {
		const nr = r + 1;
		const nc = c;

		if (!inBounds(nr, nc)) continue;

		const cell = grid[nr][nc];

		if (cell === ".") {
			nextActive.push([nr, nc]);
		} else if (cell === "^") {
			splitThisStep++;
			totalSplits1++;

			const leftC = nc - 1;
			const rightC = nc + 1;

			if (inBounds(nr, leftC)) nextActive.push([nr, leftC]);
			if (inBounds(nr, rightC)) nextActive.push([nr, rightC]);
		} else {
			nextActive.push([nr, nc]);
		}
	}

	const uniqueBeams = [...new Set(nextActive.map(([r, c]) => `${r},${c}`))].map(
		(s) => s.split(",").map(Number) as BeamPosition,
	);

	if (uniqueBeams.length > 0) {
		stages1.push({
			beams: uniqueBeams,
			splitCount: splitThisStep,
			totalSplits: totalSplits1,
			step: stages1.length,
		});
	}

	active1 = uniqueBeams;
}

// ============ PART 2: Track timeline counts per position ============
type Stage2 = {
	positions: Record<string, number>; // "r,c" -> count
	totalTimelines: number;
	step: number;
};

const stages2: Stage2[] = [];
let currentStates: Record<string, number> = { [`${startRow},${startCol}`]: 1 };

stages2.push({
	positions: { ...currentStates },
	totalTimelines: 1,
	step: 0,
});

for (let step = 0; step < ROWS; step++) {
	const nextStates: Record<string, number> = {};

	for (const [key, count] of Object.entries(currentStates)) {
		const [r, c] = key.split(",").map(Number);
		const nr = r + 1;

		if (nr >= ROWS) continue;
		if (!inBounds(nr, c)) continue;

		const cell = grid[nr][c];

		if (cell === ".") {
			const nkey = `${nr},${c}`;
			nextStates[nkey] = (nextStates[nkey] || 0) + count;
		} else if (cell === "^") {
			const lc = c - 1;
			const rc = c + 1;
			if (inBounds(nr, lc)) {
				const lkey = `${nr},${lc}`;
				nextStates[lkey] = (nextStates[lkey] || 0) + count;
			}
			if (inBounds(nr, rc)) {
				const rkey = `${nr},${rc}`;
				nextStates[rkey] = (nextStates[rkey] || 0) + count;
			}
		} else {
			const nkey = `${nr},${c}`;
			nextStates[nkey] = (nextStates[nkey] || 0) + count;
		}
	}

	if (Object.keys(nextStates).length === 0) break;

	const totalTimelines = Object.values(nextStates).reduce((a, b) => a + b, 0);
	stages2.push({
		positions: { ...nextStates },
		totalTimelines,
		step: stages2.length,
	});

	currentStates = nextStates;
}

const finalTimelines = stages2[stages2.length - 1]?.totalTimelines ?? 1;

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AOC 2025 Day 7 - Timeline Beam Splitting</title>
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
		.mode-toggle input[type="checkbox"] {
			display: none;
		}
		.grid-container {
			background: #11111b;
			padding: 10px;
			border: 2px solid #313244;
			border-radius: 4px;
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			max-width: 95vw;
			overflow: hidden;
		}
		.grid {
			display: grid;
			gap: 1px;
			image-rendering: pixelated;
		}
		.cell {
			background: #181825;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 14px;
			transition: background 0.15s ease;
			position: relative;
		}
		.cell.splitter {
			background: #fab387;
			color: #1e1e2e;
		}
		.cell.start {
			background: #f9e2af;
			color: #1e1e2e;
			font-weight: bold;
		}
		.cell.beam {
			background: #a6e3a1;
			box-shadow: 0 0 8px #a6e3a1, 0 0 16px #a6e3a1;
			animation: pulse 0.5s ease-in-out infinite alternate;
		}
		.cell.beam-trail {
			background: rgba(166, 227, 161, 0.25);
		}
		.cell .count {
			font-size: 10px;
			font-weight: bold;
			color: #1e1e2e;
		}
		.cell.beam .count {
			text-shadow: 0 0 2px #cdd6f4;
		}
		@keyframes pulse {
			from { box-shadow: 0 0 8px #a6e3a1, 0 0 16px #a6e3a1; }
			to { box-shadow: 0 0 12px #a6e3a1, 0 0 24px #a6e3a1; }
		}
		.stats {
			margin-top: 20px;
			color: #a6adc8;
			text-align: center;
			font-size: 13px;
		}
		.legend {
			display: flex;
			gap: 20px;
			margin-top: 15px;
			flex-wrap: wrap;
			justify-content: center;
		}
		.legend-item {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 12px;
			color: #a6adc8;
		}
		.legend-box {
			width: 16px;
			height: 16px;
		}
		.legend-box.start { background: #f9e2af; }
		.legend-box.splitter { background: #fab387; }
		.legend-box.beam { background: #a6e3a1; box-shadow: 0 0 4px #a6e3a1; }
		.legend-box.empty { background: #181825; border: 1px solid #313244; }
		.footer {
			margin-top: 20px;
			color: #a6adc8;
			text-align: center;
			font-size: 12px;
		}
		.speed-control {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.speed-control input[type="range"] {
			-webkit-appearance: none;
			appearance: none;
			width: 120px;
			height: 6px;
			background: #313244;
			outline: none;
			border: 1px solid #313244;
		}
		.speed-control input[type="range"]::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 16px;
			height: 16px;
			background: #a6e3a1;
			cursor: pointer;
			border: 1px solid #313244;
		}
		.speed-control input[type="range"]::-moz-range-thumb {
			width: 16px;
			height: 16px;
			background: #a6e3a1;
			cursor: pointer;
			border: 1px solid #313244;
		}
		.speed-control input[type="range"]::-webkit-slider-thumb:hover {
			background: #b4e7b9;
		}
		.speed-control input[type="range"]::-moz-range-thumb:hover {
			background: #b4e7b9;
		}
	</style>
</head>
<body>
	<h1>AOC 2025 Day 7 - Timeline Beam Splitting</h1>

	<div class="mode-toggle">
		<label id="part1Label">Part 1</label>
		<label id="part2Label">Part 2</label>
	</div>

	<div style="color: #a6adc8; font-size: 12px; margin-bottom: 5px;">Contribution by <a href="https://jaspermayone.com">@jsp</a> ♥</div>

	<div class="controls">
		<button id="prev">← Previous</button>
		<button id="play" data-playing="false">▶ Play</button>
		<button id="next">Next →</button>
		<button id="reset">↺ Reset</button>
		<span class="speed-control">
			<label for="speed">Speed:</label>
			<input type="range" id="speed" min="100" max="1000" value="400" step="50">
		</span>
	</div>

	<div class="info" id="infoBar">
		Step: <span id="step">0</span> / <span id="total">${stages1.length - 1}</span>
		| <span id="metricLabel">Active Beams</span>: <span id="metricValue">1</span>
		| <span id="secondaryLabel">Total Splits</span>: <span id="secondaryValue">0</span>
	</div>

	<div class="grid-container">
		<div id="grid" class="grid"></div>
	</div>

	<div class="legend">
		<div class="legend-item"><div class="legend-box start"></div> Start (S)</div>
		<div class="legend-item"><div class="legend-box splitter"></div> Splitter (^)</div>
		<div class="legend-item"><div class="legend-box beam"></div> Active Beam</div>
		<div class="legend-item"><div class="legend-box empty"></div> Empty (.)</div>
	</div>

	<div class="stats" id="statsBar">
		Grid: ${ROWS} × ${COLS}
		| Total steps: ${stages1.length - 1}
		| Final beams: ${stages1[stages1.length - 1]?.beams.length ?? 1}
		| Total splits: ${totalSplits1}
	</div>

	<div class="footer">
		<a href="../index.html">[Return to Index]</a>
	</div>

	<script>
		const grid = ${JSON.stringify(grid)};
		const stages1 = ${JSON.stringify(stages1)};
		const stages2 = ${JSON.stringify(stages2)};
		const ROWS = ${ROWS};
		const COLS = ${COLS};
		const totalSplits1 = ${totalSplits1};
		const finalTimelines = ${finalTimelines};

		let currentStage = 0;
		let playInterval = null;
		let beamTrail = new Set();
		let isPart2 = false;

		const gridEl = document.getElementById('grid');
		const stepEl = document.getElementById('step');
		const totalEl = document.getElementById('total');
		const metricLabelEl = document.getElementById('metricLabel');
		const metricValueEl = document.getElementById('metricValue');
		const secondaryLabelEl = document.getElementById('secondaryLabel');
		const secondaryValueEl = document.getElementById('secondaryValue');
		const prevBtn = document.getElementById('prev');
		const nextBtn = document.getElementById('next');
		const playBtn = document.getElementById('play');
		const resetBtn = document.getElementById('reset');
		const speedSlider = document.getElementById('speed');
		const part1Label = document.getElementById('part1Label');
		const part2Label = document.getElementById('part2Label');
		const statsBar = document.getElementById('statsBar');

		function getStages() {
			return isPart2 ? stages2 : stages1;
		}

		function updateModeLabels() {
			part1Label.classList.toggle('active', !isPart2);
			part2Label.classList.toggle('active', isPart2);

			if (isPart2) {
				metricLabelEl.textContent = 'Total Timelines';
				secondaryLabelEl.textContent = 'Positions';
				statsBar.innerHTML = \`Grid: ${ROWS} × ${COLS} | Total steps: \${stages2.length - 1} | Final timelines: \${finalTimelines}\`;
			} else {
				metricLabelEl.textContent = 'Active Beams';
				secondaryLabelEl.textContent = 'Total Splits';
				statsBar.innerHTML = \`Grid: ${ROWS} × ${COLS} | Total steps: \${stages1.length - 1} | Final beams: \${stages1[stages1.length - 1]?.beams.length ?? 1} | Total splits: \${totalSplits1}\`;
			}

			totalEl.textContent = getStages().length - 1;
		}

		function renderGrid() {
			const stages = getStages();
			const stage = stages[currentStage];

			let beamPositions = new Map(); // key -> count (for part 2) or 1 (for part 1)

			if (isPart2) {
				for (const [key, count] of Object.entries(stage.positions)) {
					beamPositions.set(key, count);
				}
			} else {
				stage.beams.forEach(([r, c]) => beamPositions.set(r + ',' + c, 1));
			}

			// Add current beams to trail
			for (const key of beamPositions.keys()) {
				beamTrail.add(key);
			}

			if (gridEl.children.length === 0) {
				gridEl.style.gridTemplateColumns = \`repeat(\${COLS}, 1fr)\`;
				for (let r = 0; r < ROWS; r++) {
					for (let c = 0; c < COLS; c++) {
						const cell = document.createElement('div');
						cell.className = 'cell';
						cell.dataset.row = r;
						cell.dataset.col = c;
						gridEl.appendChild(cell);
					}
				}
			}

			const cells = gridEl.children;
			for (let r = 0; r < ROWS; r++) {
				for (let c = 0; c < COLS; c++) {
					const idx = r * COLS + c;
					const cell = cells[idx];
					const char = grid[r][c];
					const key = r + ',' + c;

					cell.className = 'cell';
					cell.textContent = '';

					const count = beamPositions.get(key);
					if (count !== undefined) {
						cell.classList.add('beam');
						if (isPart2 && count > 1) {
							const countSpan = document.createElement('span');
							countSpan.className = 'count';
							countSpan.textContent = count > 999 ? '999+' : count;
							cell.appendChild(countSpan);
						}
					} else if (beamTrail.has(key) && currentStage > 0) {
						cell.classList.add('beam-trail');
					}

					if (char === 'S') {
						cell.classList.add('start');
						if (!count) cell.textContent = 'S';
					} else if (char === '^') {
						cell.classList.add('splitter');
						if (!count) cell.textContent = '^';
					}
				}
			}

			scaleGrid();

			stepEl.textContent = currentStage;

			if (isPart2) {
				metricValueEl.textContent = stage.totalTimelines;
				secondaryValueEl.textContent = Object.keys(stage.positions).length;
			} else {
				metricValueEl.textContent = stage.beams.length;
				secondaryValueEl.textContent = stage.totalSplits;
			}

			prevBtn.disabled = currentStage === 0;
			nextBtn.disabled = currentStage === stages.length - 1;
		}

		function scaleGrid() {
			const container = document.querySelector('.grid-container');
			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;

			const cellWidth = Math.floor((containerWidth - COLS) / COLS);
			const cellHeight = Math.floor((containerHeight - ROWS) / ROWS);

			const cellSize = Math.max(1, Math.min(cellWidth, cellHeight, 20));

			const cells = gridEl.children;
			for (let i = 0; i < cells.length; i++) {
				cells[i].style.width = cellSize + 'px';
				cells[i].style.height = cellSize + 'px';
				cells[i].style.fontSize = Math.max(10, cellSize * 0.5) + 'px';
			}
		}

		function goToStage(index) {
			const stages = getStages();
			// If going backwards, rebuild trail
			if (index < currentStage) {
				beamTrail = new Set();
				for (let i = 0; i <= index; i++) {
					if (isPart2) {
						Object.keys(stages[i].positions).forEach(key => beamTrail.add(key));
					} else {
						stages[i].beams.forEach(([r, c]) => beamTrail.add(r + ',' + c));
					}
				}
			}
			currentStage = Math.max(0, Math.min(stages.length - 1, index));
			renderGrid();
		}

		function resetAnimation() {
			beamTrail = new Set();
			goToStage(0);
		}

		function toggleMode() {
			isPart2 = !isPart2;
			updateModeLabels();

			// Clamp stage to new max
			const stages = getStages();
			if (currentStage >= stages.length) {
				currentStage = stages.length - 1;
			}

			// Rebuild trail for current stage
			beamTrail = new Set();
			for (let i = 0; i <= currentStage; i++) {
				if (isPart2) {
					Object.keys(stages[i].positions).forEach(key => beamTrail.add(key));
				} else {
					stages[i].beams.forEach(([r, c]) => beamTrail.add(r + ',' + c));
				}
			}

			renderGrid();
		}

		part1Label.addEventListener('click', () => {
			if (isPart2) toggleMode();
		});

		part2Label.addEventListener('click', () => {
			if (!isPart2) toggleMode();
		});

		prevBtn.addEventListener('click', () => goToStage(currentStage - 1));
		nextBtn.addEventListener('click', () => goToStage(currentStage + 1));
		resetBtn.addEventListener('click', resetAnimation);

		playBtn.addEventListener('click', () => {
			if (playInterval) {
				clearInterval(playInterval);
				playInterval = null;
				playBtn.textContent = '▶ Play';
			} else {
				const stages = getStages();
				if (currentStage === stages.length - 1) {
					resetAnimation();
				}
				playBtn.textContent = '⏸ Pause';
				const speed = 1100 - parseInt(speedSlider.value);
				playInterval = setInterval(() => {
					const stages = getStages();
					if (currentStage < stages.length - 1) {
						goToStage(currentStage + 1);
					} else {
						clearInterval(playInterval);
						playInterval = null;
						playBtn.textContent = '▶ Play';
					}
				}, speed);
			}
		});

		speedSlider.addEventListener('input', () => {
			if (playInterval) {
				clearInterval(playInterval);
				const speed = 1100 - parseInt(speedSlider.value);
				playInterval = setInterval(() => {
					const stages = getStages();
					if (currentStage < stages.length - 1) {
						goToStage(currentStage + 1);
					} else {
						clearInterval(playInterval);
						playInterval = null;
						playBtn.textContent = '▶ Play';
					}
				}, speed);
			}
		});

		document.addEventListener('keydown', (e) => {
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

		window.addEventListener('resize', scaleGrid);
		updateModeLabels();
		renderGrid();
	</script>
</body>
</html>`;

await Bun.write(`${scriptDir}/index.html`, html);
console.log("Generated index.html");
console.log("Part 1:", stages1.length, "stages,", totalSplits1, "splits,", stages1[stages1.length - 1]?.beams.length ?? 0, "final beams");
console.log("Part 2:", stages2.length, "stages,", finalTimelines, "final timelines");
