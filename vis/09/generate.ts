const scriptDir = import.meta.dir;
const file = await Bun.file(`${scriptDir}/../../shared/09/input.txt`).text();

// Parse tile coordinates
const tiles = file
	.trim()
	.split("\n")
	.map((line) => {
		const [x, y] = line.split(",").map(Number);
		return { x, y };
	});

// Find grid bounds
const minX = Math.min(...tiles.map((t) => t.x));
const maxX = Math.max(...tiles.map((t) => t.x));
const minY = Math.min(...tiles.map((t) => t.y));
const maxY = Math.max(...tiles.map((t) => t.y));

// Calculate all possible rectangles and their areas
// We'll pre-compute key milestones for the animation
const milestones = [];
let maxAreaSoFar = 0;
let totalRectangles = 0;

for (let i = 0; i < tiles.length; i++) {
	for (let j = i + 1; j < tiles.length; j++) {
		const t1 = tiles[i];
		const t2 = tiles[j];

		totalRectangles++;

		// Calculate area (inclusive coordinates)
		const width = Math.abs(t2.x - t1.x) + 1;
		const height = Math.abs(t2.y - t1.y) + 1;
		const area = width * height;

		if (area > maxAreaSoFar) {
			// Found a new maximum!
			maxAreaSoFar = area;
			milestones.push({
				x1: Math.min(t1.x, t2.x),
				y1: Math.min(t1.y, t2.y),
				x2: Math.max(t1.x, t2.x),
				y2: Math.max(t1.y, t2.y),
				area,
				tile1: i,
				tile2: j,
				isMax: true,
			});
		}
	}
}

// Add some non-max rectangles for visualization variety
// Sample rectangles at regular intervals to show the search process
const samples = [];
const sampleInterval = Math.floor(totalRectangles / 100); // Sample ~100 rectangles
let sampleCounter = 0;

for (let i = 0; i < tiles.length; i++) {
	for (let j = i + 1; j < tiles.length; j++) {
		sampleCounter++;
		if (sampleCounter % sampleInterval === 0) {
			const t1 = tiles[i];
			const t2 = tiles[j];
			const width = Math.abs(t2.x - t1.x) + 1;
			const height = Math.abs(t2.y - t1.y) + 1;
			const area = width * height;

			if (area > 0) {
				samples.push({
					x1: Math.min(t1.x, t2.x),
					y1: Math.min(t1.y, t2.y),
					x2: Math.max(t1.x, t2.x),
					y2: Math.max(t1.y, t2.y),
					area,
					tile1: i,
					tile2: j,
					isMax: false,
				});
			}
		}
	}
}

// Combine and sort by discovery order (tile1, then tile2)
const allStages = [...samples, ...milestones].sort((a, b) => {
	if (a.tile1 !== b.tile1) return a.tile1 - b.tile1;
	return a.tile2 - b.tile2;
});

// Rebuild isMax flags after sorting
let currentMax = 0;
allStages.forEach((stage) => {
	if (stage.area > currentMax) {
		stage.isMax = true;
		currentMax = stage.area;
	} else {
		stage.isMax = false;
	}
});

// Part 2: Build compressed grid and flood fill
function computePart2Data() {
	const _minX = Math.min(...tiles.map((p) => p.x)) - 1;
	const _minY = Math.min(...tiles.map((p) => p.y)) - 1;
	const __points = tiles.map((p) => ({ x: p.x - _minX, y: p.y - _minY }));

	const xs = __points
		.map((p) => p.x)
		.toSorted((a, b) => a - b)
		.filter((_, i) => i % 2 === 0);
	const ys = __points
		.map((p) => p.y)
		.toSorted((a, b) => a - b)
		.filter((_, i) => i % 2 === 0);
	const points = __points.map((p) => ({
		x: 1 + xs.indexOf(p.x) * 2,
		y: 1 + ys.indexOf(p.y) * 2,
	}));

	const grid: number[][] = [];
	const width = Math.max(...points.map((p) => p.x)) + 1;
	const height = Math.max(...points.map((p) => p.y)) + 1;

	for (let y = 0; y <= height; y++) {
		grid[y] = [];
		for (let x = 0; x <= width; x++) {
			grid[y][x] = 0;
		}
	}

	// Mark red tiles and green connecting tiles
	points.forEach((p, pIndex) => {
		grid[p.y][p.x] = 1; // Red tile
		const nextPoint = points[(pIndex + 1) % points.length];
		const deltaX = Math.sign(nextPoint.x - p.x);
		const deltaY = Math.sign(nextPoint.y - p.y);
		if (deltaX !== 0) {
			let currentX = p.x + deltaX;
			while (currentX !== nextPoint.x) {
				if (grid[p.y][currentX] === 0) {
					grid[p.y][currentX] = 2; // Green tile
				}
				currentX += deltaX;
			}
		}
		if (deltaY !== 0) {
			let currentY = p.y + deltaY;
			while (currentY !== nextPoint.y) {
				if (grid[currentY][p.x] === 0) {
					grid[currentY][p.x] = 2; // Green tile
				}
				currentY += deltaY;
			}
		}
	});

	// Flood fill from border
	let open = [{ x: 0, y: 0 }];
	const floodFill = (x: number, y: number) => {
		if (x < 0 || x > width || y < 0 || y > height || grid[y][x] !== 0) {
			return;
		}
		grid[y][x] = -1; // Outside
		const add = (nx: number, ny: number) => {
			if (
				nx >= 0 &&
				nx <= width &&
				ny >= 0 &&
				ny <= height &&
				grid[ny][nx] === 0
			) {
				open.push({ x: nx, y: ny });
			}
		};
		add(x + 1, y);
		add(x - 1, y);
		add(x, y + 1);
		add(x, y - 1);
	};
	while (open.length > 0) {
		const point = open.pop()!;
		floodFill(point.x, point.y);
	}

	const hasOnlyValidPoints = (pointA: any, pointB: any): boolean => {
		for (
			let y = Math.min(pointA.y, pointB.y);
			y <= Math.max(pointA.y, pointB.y);
			y++
		) {
			for (
				let x = Math.min(pointA.x, pointB.x);
				x <= Math.max(pointA.x, pointB.x);
				x++
			) {
				if (grid[y][x] < 0) {
					return false;
				}
			}
		}
		return true;
	};

	return { points, hasOnlyValidPoints };
}

const part2Data = computePart2Data();

// Calculate Part 2 rectangles
const part2Milestones = [];
let part2MaxArea = 0;
const part2Samples = [];
let part2SampleCounter = 0;
const part2SampleInterval = 100; // Sample less frequently since we check all pairs now

for (let i = 0; i < tiles.length; i++) {
	for (let j = i + 1; j < tiles.length; j++) {
		const t1 = tiles[i];
		const t2 = tiles[j];

		const width = Math.abs(t2.x - t1.x) + 1;
		const height = Math.abs(t2.y - t1.y) + 1;
		const area = width * height;

		// Skip if can't beat current max
		if (area <= part2MaxArea) continue;

		// Check using compressed grid
		if (part2Data.hasOnlyValidPoints(part2Data.points[i], part2Data.points[j])) {
			part2SampleCounter++;
			const minRectX = Math.min(t1.x, t2.x);
			const maxRectX = Math.max(t1.x, t2.x);
			const minRectY = Math.min(t1.y, t2.y);
			const maxRectY = Math.max(t1.y, t2.y);

			if (area > part2MaxArea) {
				part2MaxArea = area;
				part2Milestones.push({
					x1: minRectX,
					y1: minRectY,
					x2: maxRectX,
					y2: maxRectY,
					area,
					tile1: i,
					tile2: j,
					isMax: true,
				});
			} else if (part2SampleCounter % part2SampleInterval === 0) {
				part2Samples.push({
					x1: minRectX,
					y1: minRectY,
					x2: maxRectX,
					y2: maxRectY,
					area,
					tile1: i,
					tile2: j,
					isMax: false,
				});
			}
		}
	}
}

console.log(
	`Part 2: Found ${part2SampleCounter} valid rectangles, ${part2Milestones.length} milestones`,
);

const part2Stages = [...part2Samples, ...part2Milestones].sort((a, b) => {
	if (a.tile1 !== b.tile1) return a.tile1 - b.tile1;
	return a.tile2 - b.tile2;
});

// Rebuild isMax flags for part2
let currentMaxPart2 = 0;
part2Stages.forEach((stage) => {
	if (stage.area > currentMaxPart2) {
		stage.isMax = true;
		currentMaxPart2 = stage.area;
	} else {
		stage.isMax = false;
	}
});

// For visualization, compute green tiles (boundary tiles)
const greenTiles: Array<{ x: number; y: number }> = [];
for (let i = 0; i < tiles.length; i++) {
	const t1 = tiles[i];
	const t2 = tiles[(i + 1) % tiles.length];

	if (t1.x === t2.x) {
		const minY = Math.min(t1.y, t2.y);
		const maxY = Math.max(t1.y, t2.y);
		for (let y = minY + 1; y < maxY; y++) {
			greenTiles.push({ x: t1.x, y });
		}
	} else if (t1.y === t2.y) {
		const minX = Math.min(t1.x, t2.x);
		const maxX = Math.max(t1.x, t2.x);
		for (let x = minX + 1; x < maxX; x++) {
			greenTiles.push({ x, y: t1.y });
		}
	}
}

const tilesData = JSON.stringify(tiles);
const greenTilesData = JSON.stringify(greenTiles);
const stagesData = JSON.stringify(allStages);
const part2StagesData = JSON.stringify(part2Stages);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AoC 2025 Day 9 - Movie Theater Floor</title>
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
		#canvas {
			border: 2px solid #313244;
			image-rendering: pixelated;
			image-rendering: crisp-edges;
			max-width: 95vw;
			max-height: 70vh;
			margin: 20px 0;
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
		.controls {
			background: #11111b;
			border: 1px solid #313244;
			padding: 15px;
			margin: 15px 0;
			max-width: 800px;
			border-radius: 4px;
		}
		.control-row {
			display: flex;
			gap: 15px;
			align-items: center;
			margin-bottom: 15px;
			flex-wrap: wrap;
			justify-content: center;
		}
		.control-row:last-child {
			margin-bottom: 0;
		}
		button {
			background: #11111b;
			color: #a6e3a1;
			border: 1px solid #313244;
			padding: 8px 16px;
			cursor: pointer;
			font-family: inherit;
			font-size: 14px;
			border-radius: 3px;
		}
		button:hover {
			background: #181825;
		}
		button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.stats {
			background: #11111b;
			border: 1px solid #313244;
			padding: 10px 15px;
			margin: 10px 0;
			max-width: 800px;
			border-radius: 4px;
			text-align: center;
			font-size: 13px;
			color: #a6adc8;
		}
		.legend {
			display: flex;
			gap: 15px;
			margin-top: 10px;
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
			width: 12px;
			height: 12px;
			border-radius: 2px;
		}
		.legend-box.red { background: #f38ba8; }
		.legend-box.green { background: #a6e3a1; }
		.legend-box.current { background: rgba(137, 180, 250, 0.3); border: 2px solid #89b4fa; }
		.legend-box.best { background: rgba(166, 227, 161, 0.3); border: 2px solid #a6e3a1; }
		a {
			text-decoration: none;
			color: #a6e3a1;
			outline: 0;
		}
		a:hover, a:focus {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<h1>AoC 2025 Day 9 - Movie Theater Floor</h1>
	
	<div class="mode-toggle">
		<label id="part1Label">Part 1: Any Rectangle</label>
		<label id="part2Label">Part 2: Red/Green Only</label>
	</div>
	
	<div class="controls">
		<div class="control-row">
			<button id="prev">← Previous</button>
			<button id="play">▶ Play</button>
			<button id="next">Next →</button>
			<button id="reset">↺ Reset</button>
			<button id="jumpToEnd">⏭ Jump to End</button>
		</div>
		<div class="legend">
			<div class="legend-item"><div class="legend-box red"></div> Red Tile</div>
			<div class="legend-item" id="greenLegend" style="display: none;"><div class="legend-box green"></div> Green Tile</div>
			<div class="legend-item"><div class="legend-box current"></div> Testing (Blue)</div>
			<div class="legend-item"><div class="legend-box best"></div> Largest Found (Green)</div>
		</div>
	</div>

	<canvas id="canvas"></canvas>

	<div class="stats">
		<div id="statsInfo">Step 0/${allStages.length} | Current: 0 | Largest: 0</div>
		<div style="margin-top: 5px; font-size: 11px;"><a href="../index.html">[Return to Index]</a></div>
	</div>

	<script type="module">
		const tiles = ${tilesData};
		const greenTiles = ${greenTilesData};
		const part1Stages = ${stagesData};
		const part2Stages = ${part2StagesData};

		const minX = ${minX};
		const maxX = ${maxX};
		const minY = ${minY};
		const maxY = ${maxY};

		let isPart2 = false;
		let stages = part1Stages;

		console.log(\`Loaded \${tiles.length} red tiles, \${greenTiles.length} green tiles\`);
		console.log(\`Part 1: \${part1Stages.length} stages, Part 2: \${part2Stages.length} stages\`);

		// Canvas setup - auto scale to fit viewport
		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');

		function resizeCanvas() {
			// Calculate available space (leave room for controls and stats)
			const availableWidth = window.innerWidth - 40; // 20px padding on each side
			const availableHeight = window.innerHeight - 310; // room for controls and stats

			// Calculate grid dimensions
			const gridWidth = maxX - minX;
			const gridHeight = maxY - minY;
			
			// Calculate scale to fit available space while maintaining aspect ratio
			const scaleX = availableWidth / (gridWidth + 1000);
			const scaleY = availableHeight / (gridHeight + 1000);
			const scale = Math.min(scaleX, scaleY);

			// Set canvas size
			canvas.width = (gridWidth + 1000) * scale;
			canvas.height = (gridHeight + 1000) * scale;

			return scale;
		}

		let scale = resizeCanvas();
		const PADDING = 500; // grid units of padding
		
		function getTileSize() {
			return Math.max(1, scale * 100); // Scale tile size with canvas
		}

		// Recalculate on window resize
		window.addEventListener('resize', () => {
			scale = resizeCanvas();
			updateUI();
		});

		function toCanvasX(x) {
			return (x - minX + PADDING) * scale;
		}

		function toCanvasY(y) {
			return (y - minY + PADDING) * scale;
		}

		function drawGrid(currentRect, bestRect) {
			// Clear canvas
			ctx.fillStyle = '#1e1e2e';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw best rectangle (green) if it exists and is different from current
			if (bestRect && (!currentRect || bestRect !== currentRect)) {
				const x1 = toCanvasX(bestRect.x1);
				const y1 = toCanvasY(bestRect.y1);
				const x2 = toCanvasX(bestRect.x2);
				const y2 = toCanvasY(bestRect.y2);

				// Draw filled rectangle
				ctx.fillStyle = 'rgba(166, 227, 161, 0.15)';
				ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

				// Draw border
				ctx.strokeStyle = '#89b4fa'; // Blue
				ctx.lineWidth = 1;
				ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

				// Highlight corner tiles (green)
				const tileSize = getTileSize();
				ctx.fillStyle = '#a6e3a1';
				ctx.beginPath();
				ctx.arc(x1, y1, tileSize * 1.5, 0, Math.PI * 2);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(x2, y2, tileSize * 1.5, 0, Math.PI * 2);
				ctx.fill();
			}

			// Draw current rectangle being tested (red) on top
			if (currentRect) {
				const x1 = toCanvasX(currentRect.x1);
				const y1 = toCanvasY(currentRect.y1);
				const x2 = toCanvasX(currentRect.x2);
				const y2 = toCanvasY(currentRect.y2);

				// Draw filled rectangle
				ctx.fillStyle = 'rgba(137, 180, 250, 0.15)'; // Blue
				ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

				// Draw border (blue for current)
				ctx.strokeStyle = '#89b4fa'; // Blue
				ctx.lineWidth = 1;
				ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

				// Highlight corner tiles (blue)
				const tileSize = getTileSize();
				ctx.fillStyle = '#89b4fa'; // Blue
				ctx.beginPath();
				ctx.arc(x1, y1, tileSize * 1.5, 0, Math.PI * 2);
				ctx.fill();
				ctx.beginPath();
				ctx.arc(x2, y2, tileSize * 1.5, 0, Math.PI * 2);
				ctx.fill();
			}

			// Draw all red tiles on top
			const tileSize = getTileSize();
			ctx.fillStyle = '#f38ba8';
			tiles.forEach(tile => {
				const x = toCanvasX(tile.x);
				const y = toCanvasY(tile.y);
				ctx.beginPath();
				ctx.arc(x, y, tileSize, 0, Math.PI * 2);
				ctx.fill();
			});

			// Draw green tiles if Part 2
			if (isPart2) {
				ctx.fillStyle = 'rgba(166, 227, 161, 0.6)';
				greenTiles.forEach(tile => {
					const x = toCanvasX(tile.x);
					const y = toCanvasY(tile.y);
					ctx.beginPath();
					ctx.arc(x, y, tileSize * 0.7, 0, Math.PI * 2);
					ctx.fill();
				});
			}
		}

		// Animation state
		let currentIndex = 0;
		let isPlaying = false;
		let animationSpeed = 100; // ms between frames

		const playBtn = document.getElementById('play');
		const prevBtn = document.getElementById('prev');
		const nextBtn = document.getElementById('next');
		const resetBtn = document.getElementById('reset');
		const jumpToEndBtn = document.getElementById('jumpToEnd');
		const statsInfo = document.getElementById('statsInfo');
		const part1Label = document.getElementById('part1Label');
		const part2Label = document.getElementById('part2Label');
		const greenLegend = document.getElementById('greenLegend');

		// Mode toggle
		function setMode(part2) {
			isPart2 = part2;
			stages = isPart2 ? part2Stages : part1Stages;
			currentIndex = 0;
			isPlaying = false;
			playBtn.textContent = '▶ Play';
			
			if (isPart2) {
				part1Label.classList.remove('active');
				part2Label.classList.add('active');
				greenLegend.style.display = 'flex';
			} else {
				part1Label.classList.add('active');
				part2Label.classList.remove('active');
				greenLegend.style.display = 'none';
			}
			
			updateUI();
		}

		part1Label.addEventListener('click', () => setMode(false));
		part2Label.addEventListener('click', () => setMode(true));
		part1Label.classList.add('active');

		function updateUI() {
			const currentRect = currentIndex > 0 ? stages[currentIndex - 1] : null;
			
			// Find the best rectangle up to current index
			let bestRect = null;
			let largestSoFar = 0;
			for (let i = 0; i < currentIndex; i++) {
				if (stages[i].area > largestSoFar) {
					largestSoFar = stages[i].area;
					bestRect = stages[i];
				}
			}
			
			const currentArea = currentRect ? currentRect.area : 0;
			
			if (currentIndex > 0 && currentIndex <= 5) {
				console.log(\`Index \${currentIndex}: currentRect=\`, currentRect);
			}
			
			statsInfo.textContent = \`Step \${currentIndex}/\${stages.length} | Current: \${currentArea.toLocaleString()} | Largest: \${largestSoFar.toLocaleString()}\`;
			
			prevBtn.disabled = currentIndex === 0;
			nextBtn.disabled = currentIndex === stages.length;
			
			drawGrid(currentRect, bestRect);
		}

		function goToStage(index) {
			currentIndex = Math.max(0, Math.min(stages.length, index));
			updateUI();
		}

		prevBtn.addEventListener('click', () => goToStage(currentIndex - 1));
		nextBtn.addEventListener('click', () => goToStage(currentIndex + 1));
		resetBtn.addEventListener('click', () => goToStage(0));
		jumpToEndBtn.addEventListener('click', () => goToStage(stages.length));

		playBtn.addEventListener('click', () => {
			isPlaying = !isPlaying;
			playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
			if (isPlaying && currentIndex === stages.length) {
				goToStage(0);
			}
			if (isPlaying) {
				animate();
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
			if (e.key === 'e' || e.key === 'E') jumpToEndBtn.click();
		});

		function animate() {
			if (!isPlaying) return;

			if (currentIndex < stages.length) {
				goToStage(currentIndex + 1);
				setTimeout(animate, animationSpeed);
			} else {
				isPlaying = false;
				playBtn.textContent = '▶ Play';
			}
		}

		// Initialize
		updateUI();
	</script>
</body>
</html>`;

await Bun.write(`${scriptDir}/index.html`, html);
