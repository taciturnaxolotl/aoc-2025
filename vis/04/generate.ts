const file = await Bun.file("../../shared/04/input.txt").text();
const paperMap: boolean[][] = file
	.trim()
	.split("\n")
	.map((line) =>
		Array.from(line, (ch) => {
			if (ch === ".") return false;
			if (ch === "@") return true;

			throw new Error(`Unexpected character '${ch}' in input.`);
		}),
	);

function accessiblePapers(map: boolean[][]): {
	map: boolean[][];
	accessible: number;
} {
	let accessible = 0;
	const nextMap: boolean[][] = map.map((row) => row.slice());
	map.forEach((rows, row) => {
		rows.forEach((cell, col) => {
			if (cell) {
				let fullAdj = 0;

				const offsets: { row: number; col: number }[] = [
					// cardinal
					{ row: -1, col: 0 },
					{ row: 1, col: 0 },
					{ row: 0, col: 1 },
					{ row: 0, col: -1 },
					// diagonals
					{ row: -1, col: 1 },
					{ row: 1, col: 1 },
					{ row: -1, col: -1 },
					{ row: 1, col: -1 },
				];

				for (const off of offsets) {
					const rowIdx = row + off.row;
					const colIdx = col + off.col;

					if (rowIdx < 0 || colIdx < 0) continue;
					if (rowIdx > paperMap.length - 1 || colIdx > rows.length - 1)
						continue;

					if (map.at(rowIdx)?.at(colIdx)) fullAdj++;

					if (fullAdj >= 4) break;
				}

				if (fullAdj < 4) {
					accessible++;
					(nextMap[row] as boolean[])[col] = false;
				}
			}
		});
	});

	return { map: nextMap, accessible };
}

// Collect all stages
const stages: { map: boolean[][]; accessible: number; iteration: number }[] =
	[];
let map = paperMap;
let iteration = 0;

stages.push({ map: JSON.parse(JSON.stringify(map)), accessible: 0, iteration });

while (true) {
	const res = accessiblePapers(map);
	iteration++;

	stages.push({
		map: JSON.parse(JSON.stringify(res.map)),
		accessible: res.accessible,
		iteration,
	});

	map = res.map;
	if (res.accessible === 0) break;
}

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AOC 2025 Day 4 - Part 2 Visualization</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: 'Courier New', monospace;
			background: #0f0f23;
			color: #cccccc;
			padding: 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			min-height: 100vh;
		}
		h1 {
			color: #00cc00;
			margin-bottom: 10px;
			font-size: 24px;
		}
		.controls {
			margin: 20px 0;
			display: flex;
			gap: 10px;
			align-items: center;
			flex-wrap: wrap;
			justify-content: center;
		}
		button {
			background: #10101a;
			color: #00cc00;
			border: 1px solid #00cc00;
			padding: 8px 16px;
			cursor: pointer;
			font-family: inherit;
			font-size: 14px;
		}
		button:hover {
			background: #00cc00;
			color: #0f0f23;
		}
		button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.info {
			color: #ffff66;
			font-size: 16px;
		}
		.grid-container {
			background: #10101a;
			padding: 10px;
			border: 2px solid #333;
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
			background: #1a1a2e;
		}
		.cell.paper {
			background: #00cc00;
		}
		.stats {
			margin-top: 20px;
			color: #888;
			text-align: center;
		}
	</style>
</head>
<body>
	<h1>AOC 2025 Day 4 - Paper Removal Visualization</h1>
	
	<div class="controls">
		<button id="prev">← Previous</button>
		<button id="play" data-playing="false">▶ Play</button>
		<button id="next">Next →</button>
		<span class="info">
			Stage: <span id="stage">0</span> / <span id="total">${stages.length - 1}</span>
			| Accessible: <span id="accessible">0</span>
			| Total Removed: <span id="totalRemoved">0</span>
		</span>
	</div>

	<div class="grid-container">
		<div id="grid" class="grid"></div>
	</div>

	<div class="stats">
		Grid size: ${paperMap.length} × ${paperMap[0].length}
		| Total iterations: ${stages.length - 1}
		| Final answer: ${stages.slice(1).reduce((sum, s) => sum + s.accessible, 0)}
	</div>

	<script>
		const stages = ${JSON.stringify(stages)};
		let currentStage = 0;
		let playInterval = null;

		const grid = document.getElementById('grid');
		const stageEl = document.getElementById('stage');
		const accessibleEl = document.getElementById('accessible');
		const totalRemovedEl = document.getElementById('totalRemoved');
		const prevBtn = document.getElementById('prev');
		const nextBtn = document.getElementById('next');
		const playBtn = document.getElementById('play');

		function renderGrid() {
			const stage = stages[currentStage];
			const numRows = stage.map.length;
			const numCols = stage.map[0].length;
			
			// Only rebuild grid if it doesn't exist
			if (grid.children.length === 0) {
				grid.style.gridTemplateColumns = \`repeat(\${numCols}, 1fr)\`;
				const totalCells = numRows * numCols;
				for (let i = 0; i < totalCells; i++) {
					const cell = document.createElement('div');
					cell.className = 'cell';
					grid.appendChild(cell);
				}
			}
			
			// Update cell states
			const cells = grid.children;
			for (let row = 0; row < numRows; row++) {
				for (let col = 0; col < numCols; col++) {
					const idx = row * numCols + col;
					if (stage.map[row][col]) {
						cells[idx].classList.add('paper');
					} else {
						cells[idx].classList.remove('paper');
					}
				}
			}
			
			scaleGrid();

			stageEl.textContent = currentStage;
			accessibleEl.textContent = stage.accessible;
			
			const totalRemoved = stages.slice(1, currentStage + 1).reduce((sum, s) => sum + s.accessible, 0);
			totalRemovedEl.textContent = totalRemoved;

			prevBtn.disabled = currentStage === 0;
			nextBtn.disabled = currentStage === stages.length - 1;
		}

		function scaleGrid() {
			const container = document.querySelector('.grid-container');
			const stage = stages[currentStage];
			const numRows = stage.map.length;
			const numCols = stage.map[0].length;
			
			const containerWidth = container.clientWidth;
			const containerHeight = container.clientHeight;
			
			const cellWidth = Math.floor((containerWidth - numCols) / numCols);
			const cellHeight = Math.floor((containerHeight - numRows) / numRows);
			
			const cellSize = Math.max(1, Math.min(cellWidth, cellHeight, 20));
			
			const cells = grid.children;
			for (let i = 0; i < cells.length; i++) {
				cells[i].style.width = cellSize + 'px';
				cells[i].style.height = cellSize + 'px';
			}
		}

		function goToStage(index) {
			currentStage = Math.max(0, Math.min(stages.length - 1, index));
			renderGrid();
		}

		prevBtn.addEventListener('click', () => {
			goToStage(currentStage - 1);
		});

		nextBtn.addEventListener('click', () => {
			goToStage(currentStage + 1);
		});

		playBtn.addEventListener('click', () => {
			if (playInterval) {
				clearInterval(playInterval);
				playInterval = null;
				playBtn.textContent = '▶ Play';
			} else {
				playBtn.textContent = '⏸ Pause';
				playInterval = setInterval(() => {
					if (currentStage < stages.length - 1) {
						goToStage(currentStage + 1);
					} else {
						clearInterval(playInterval);
						playInterval = null;
						playBtn.textContent = '▶ Play';
					}
				}, 500);
			}
		});

		// Keyboard controls
		document.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowLeft') prevBtn.click();
			if (e.key === 'ArrowRight') nextBtn.click();
			if (e.key === ' ') {
				e.preventDefault();
				playBtn.click();
			}
		});

		// Rescale on window resize
		window.addEventListener('resize', scaleGrid);

		renderGrid();
	</script>
</body>
</html>`;

await Bun.write("index.html", html);
console.log("Generated index.html with", stages.length, "stages");
