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

const tilesData = JSON.stringify(tiles);
const stagesData = JSON.stringify(allStages);

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
		.legend-box.current { background: rgba(243, 139, 168, 0.3); border: 2px solid #f38ba8; }
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
			<div class="legend-item"><div class="legend-box current"></div> Testing (Red)</div>
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
		const stages = ${stagesData};

		const minX = ${minX};
		const maxX = ${maxX};
		const minY = ${minY};
		const maxY = ${maxY};

		console.log(\`Loaded \${tiles.length} tiles and \${stages.length} animation stages\`);

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
				ctx.strokeStyle = '#a6e3a1';
				ctx.lineWidth = 2;
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
				ctx.fillStyle = 'rgba(243, 139, 168, 0.15)';
				ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

				// Draw border (thicker if it's the new max)
				ctx.strokeStyle = currentRect.isMax ? '#a6e3a1' : '#f38ba8';
				ctx.lineWidth = currentRect.isMax ? 3 : 2;
				ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

				// Highlight corner tiles
				const tileSize = getTileSize();
				ctx.fillStyle = currentRect.isMax ? '#a6e3a1' : '#f38ba8';
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
			const maxArea = stages[stages.length - 1].area;
			
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
