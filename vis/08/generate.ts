const scriptDir = import.meta.dir;
const file = await Bun.file(`${scriptDir}/../../shared/08/input.txt`).text();

// Parse junction coordinates
const junctions = file
	.trim()
	.split("\n")
	.map((line) => {
		const [x, y, z] = line.split(",").map(Number);
		return { x, y, z };
	});

// Calculate all pairwise distances
function distance(a, b) {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

const pairs = [];
for (let i = 0; i < junctions.length; i++) {
	for (let j = i + 1; j < junctions.length; j++) {
		pairs.push({
			i,
			j,
			distance: distance(junctions[i], junctions[j]),
		});
	}
}

// Sort by distance
pairs.sort((a, b) => a.distance - b.distance);

// Union-Find for circuit tracking
class UnionFind {
	constructor(n) {
		this.parent = Array.from({ length: n }, (_, i) => i);
		this.size = Array(n).fill(1);
	}

	find(x) {
		if (this.parent[x] !== x) {
			this.parent[x] = this.find(this.parent[x]);
		}
		return this.parent[x];
	}

	union(x, y) {
		const rootX = this.find(x);
		const rootY = this.find(y);

		if (rootX === rootY) return false;

		if (this.size[rootX] < this.size[rootY]) {
			this.parent[rootX] = rootY;
			this.size[rootY] += this.size[rootX];
		} else {
			this.parent[rootY] = rootX;
			this.size[rootX] += this.size[rootY];
		}

		return true;
	}

	getCircuitSizes() {
		const circuits = new Map();
		for (let i = 0; i < this.parent.length; i++) {
			const root = this.find(i);
			circuits.set(root, this.size[root]);
		}
		return Array.from(circuits.values()).sort((a, b) => b - a);
	}

	getCircuitCount() {
		const roots = new Set();
		for (let i = 0; i < this.parent.length; i++) {
			roots.add(this.find(i));
		}
		return roots.size;
	}
}

// Build animation stages for Part 1 (first 1000 connections) and Part 2 (until single circuit)
const stages = [];
const uf = new UnionFind(junctions.length);
const connections = [];
let part2ConnectionIndex = -1;
let part2Product = 0;

let step = 0;
while (true) {
	const circuitSizes = uf.getCircuitSizes();
	const top3 = circuitSizes.slice(0, 3);
	const product = top3.length >= 3 ? top3[0] * top3[1] * top3[2] : 0;
	const circuitCount = uf.getCircuitCount();

	stages.push({
		connections: [...connections],
		circuits: circuitCount,
		largest: circuitSizes[0] || 1,
		product,
		circuitSizes: [...circuitSizes],
		part2Product: part2Product,
	});

	// Check if we've reached a single circuit (Part 2 complete)
	if (circuitCount === 1 && part2ConnectionIndex === -1) {
		part2ConnectionIndex = step - 1; // The previous connection completed it
		if (part2ConnectionIndex >= 0) {
			const lastPair = pairs[part2ConnectionIndex];
			part2Product = junctions[lastPair.i].x * junctions[lastPair.j].x;
		}
		// Update the current stage with the part2Product
		stages[stages.length - 1].part2Product = part2Product;
	}

	// Stop after reaching single circuit, or if we've exhausted pairs
	if (circuitCount === 1 || step >= pairs.length) {
		break;
	}

	const pair = pairs[step];
	uf.union(pair.i, pair.j);
	connections.push(pair);
	step++;
}

console.log(
	"Part 1: After 1000 connections, product =",
	stages[Math.min(1000, stages.length - 1)].product,
);
console.log(
	"Part 2: Single circuit at connection",
	part2ConnectionIndex,
	", product =",
	part2Product,
);

const inputData = JSON.stringify(junctions);
const maxConnections = stages[stages.length - 1].connections.length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AoC 2025 Day 8 - Playground Junction Boxes</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			background: #1e1e2e;
			color: #cdd6f4;
			font-family: "Source Code Pro", monospace;
			font-size: 14pt;
			font-weight: 300;
			overflow: hidden;
			margin: 0;
			padding: 0;
		}
		#container {
			width: 100vw;
			height: 100vh;
			position: relative;
		}
		#canvas {
			width: 100%;
			height: 100%;
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			z-index: 0;
		}
		.ui {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			padding: 20px;
			pointer-events: none;
			z-index: 1;
		}
		.ui > * {
			pointer-events: auto;
		}
		h1 {
			color: #a6e3a1;
			text-shadow: 0 0 2px #a6e3a1, 0 0 5px #a6e3a1;
			margin-bottom: 10px;
			font-size: 1em;
			font-weight: normal;
			text-align: center;
		}
		.controls {
			background: rgba(17, 17, 27, 0.9);
			border: 1px solid #313244;
			padding: 15px;
			margin: 15px auto;
			max-width: 800px;
			border-radius: 4px;
		}
		.timeline-container {
			background: rgba(17, 17, 27, 0.9);
			border: 1px solid #313244;
			padding: 20px;
			margin: 10px auto;
			max-width: 800px;
			border-radius: 4px;
		}
		.timeline-label {
			color: #a6adc8;
			font-size: 12px;
			margin-bottom: 10px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.timeline-markers {
			position: relative;
			margin-top: 8px;
			font-size: 11px;
			color: #6c7086;
			height: 30px;
		}
		.timeline-marker {
			position: absolute;
			text-align: center;
			transform: translateX(-50%);
			white-space: nowrap;
		}
		.timeline-marker.start {
			left: 0%;
			transform: translateX(0);
		}
		.timeline-marker.end {
			right: 0%;
			transform: translateX(0);
			text-align: right;
		}
		.timeline-marker.highlight {
			color: #a6e3a1;
			font-weight: bold;
		}
		.timeline-slider {
			width: 100% !important;
			-webkit-appearance: none;
			appearance: none;
			height: 12px;
			background: linear-gradient(to right, #313244 0%, #313244 100%);
			outline: none;
			border-radius: 6px;
			cursor: pointer;
			position: relative;
		}
		.timeline-slider::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 24px;
			height: 24px;
			background: #a6e3a1;
			cursor: grab;
			border-radius: 50%;
			border: 3px solid #11111b;
			box-shadow: 0 2px 8px rgba(166, 227, 161, 0.4);
			transition: all 0.2s ease;
		}
		.timeline-slider::-moz-range-thumb {
			width: 24px;
			height: 24px;
			background: #a6e3a1;
			cursor: grab;
			border-radius: 50%;
			border: 3px solid #11111b;
			box-shadow: 0 2px 8px rgba(166, 227, 161, 0.4);
			transition: all 0.2s ease;
		}
		.timeline-slider::-webkit-slider-thumb:hover {
			background: #b4e7b9;
			transform: scale(1.1);
			box-shadow: 0 4px 12px rgba(166, 227, 161, 0.6);
		}
		.timeline-slider::-moz-range-thumb:hover {
			background: #b4e7b9;
			transform: scale(1.1);
			box-shadow: 0 4px 12px rgba(166, 227, 161, 0.6);
		}
		.timeline-slider:active::-webkit-slider-thumb {
			cursor: grabbing;
			transform: scale(0.95);
		}
		.timeline-slider:active::-moz-range-thumb {
			cursor: grabbing;
			transform: scale(0.95);
		}
		.control-row {
			display: flex;
			gap: 15px;
			align-items: center;
			margin-bottom: -1rem;
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
		.info {
			color: #f9e2af;
			font-size: 14px;
		}
		.stats {
			background: rgba(17, 17, 27, 0.9);
			border: 1px solid #313244;
			padding: 10px 15px;
			margin: 0 auto;
			max-width: 800px;
			border-radius: 4px;
			text-align: center;
			font-size: 13px;
			color: #a6adc8;
			position: fixed;
			bottom: 20px;
			left: 50%;
			transform: translateX(-50%);
			z-index: 1;
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
			border-radius: 50%;
		}
		.legend-box.junction { background: #89b4fa; }
		.legend-box.connection { background: #a6e3a1; }
		.legend-box.circuit { background: #f9e2af; }
		input[type="range"] {
			-webkit-appearance: none;
			appearance: none;
			width: 120px;
			height: 6px;
			background: #313244;
			outline: none;
			border: 1px solid #313244;
		}
		input[type="range"]::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 16px;
			height: 16px;
			background: #a6e3a1;
			cursor: pointer;
			border: 1px solid #313244;
			border-radius: 50%;
		}
		input[type="range"]::-moz-range-thumb {
			width: 16px;
			height: 16px;
			background: #a6e3a1;
			cursor: pointer;
			border: 1px solid #313244;
			border-radius: 50%;
		}
		label {
			color: #a6adc8;
			font-size: 13px;
		}
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
	<div id="container">
		<canvas id="canvas"></canvas>
		<div class="ui">
			<h1>AoC 2025 Day 8 - Playground Junction Boxes</h1>
			
			<div class="controls">
				<div class="control-row">
					<button id="prev">← Previous</button>
					<button id="play">▶ Play</button>
					<button id="next">Next →</button>
					<button id="reset">↺ Reset</button>
				</div>
				<div class="timeline-label">
					<span>Timeline</span>
					<span id="timelineStep">Step 0 of ${stages.length - 1}</span>
				</div>
				<input type="range" id="timeline" class="timeline-slider" min="0" max="${stages.length - 1}" value="0" step="1">
				<div class="timeline-markers">
					<div class="timeline-marker start">Start<br>0</div>
					<div class="timeline-marker highlight" style="left: ${(1000 / (stages.length - 1)) * 100}%;">Part 1<br>1000</div>
					<div class="timeline-marker highlight end">Part 2<br>${stages.length - 1}</div>
				</div>
				<div class="legend">
					<div class="legend-item"><div class="legend-box junction"></div> Isolated Junction (small)</div>
					<div class="legend-item"><div class="legend-box connection"></div> Connected Junction (large)</div>
					<div class="legend-item"><div class="legend-box circuit"></div> Circuit (color-coded)</div>
				</div>
			</div>

			<div class="stats">
				<div id="statsInfo">Circuits: ${junctions.length} | Largest: 0 | Part 1: 0 | Part 2: 0</div>
				<div style="margin-top: 5px; font-size: 11px;"><a href="../index.html">[Return to Index]</a></div>
			</div>
		</div>
	</div>

	<script type="importmap">
	{
		"imports": {
			"three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
			"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
		}
	}
	</script>

	<script type="module">
		import * as THREE from 'three';
		import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

		// Input data embedded
		const junctions = ${inputData};

		// Normalize coordinates to fit in view
		const maxCoord = Math.max(...junctions.flatMap(j => [j.x, j.y, j.z]));
		const scale = 20 / maxCoord;

		// Calculate all pairwise distances
		function distance(a, b) {
			return Math.sqrt(
				(a.x - b.x) ** 2 +
				(a.y - b.y) ** 2 +
				(a.z - b.z) ** 2
			);
		}

		const pairs = [];
		for (let i = 0; i < junctions.length; i++) {
			for (let j = i + 1; j < junctions.length; j++) {
				pairs.push({
					i,
					j,
					distance: distance(junctions[i], junctions[j])
				});
			}
		}

		// Sort by distance
		pairs.sort((a, b) => a.distance - b.distance);

		// Union-Find for circuit tracking
		class UnionFind {
			constructor(n) {
				this.parent = Array.from({ length: n }, (_, i) => i);
				this.size = Array(n).fill(1);
			}

			find(x) {
				if (this.parent[x] !== x) {
					this.parent[x] = this.find(this.parent[x]);
				}
				return this.parent[x];
			}

			union(x, y) {
				const rootX = this.find(x);
				const rootY = this.find(y);
				
				if (rootX === rootY) return false;
				
				if (this.size[rootX] < this.size[rootY]) {
					this.parent[rootX] = rootY;
					this.size[rootY] += this.size[rootX];
				} else {
					this.parent[rootY] = rootX;
					this.size[rootX] += this.size[rootY];
				}
				
				return true;
			}

			getCircuitSizes() {
				const circuits = new Map();
				for (let i = 0; i < this.parent.length; i++) {
					const root = this.find(i);
					circuits.set(root, this.size[root]);
				}
				return Array.from(circuits.values()).sort((a, b) => b - a);
			}

			getCircuitCount() {
				const roots = new Set();
				for (let i = 0; i < this.parent.length; i++) {
					roots.add(this.find(i));
				}
				return roots.size;
			}
		}

		// Build animation stages for Part 1 (first 1000 connections) and Part 2 (until single circuit)
		const stages = [];
		const uf = new UnionFind(junctions.length);
		const connections = [];
		let part2ConnectionIndex = -1;
		let part2Product = 0;

		let step = 0;
		while (true) {
			const circuitSizes = uf.getCircuitSizes();
			const top3 = circuitSizes.slice(0, 3);
			const product = top3.length >= 3 ? top3[0] * top3[1] * top3[2] : 0;
			const circuitCount = uf.getCircuitCount();
			
			stages.push({
				connections: [...connections],
				circuits: circuitCount,
				largest: circuitSizes[0] || 1,
				product,
				circuitSizes: [...circuitSizes],
				part2Product: part2Product
			});

			// Check if we've reached a single circuit (Part 2 complete)
			if (circuitCount === 1 && part2ConnectionIndex === -1) {
				part2ConnectionIndex = step - 1; // The previous connection completed it
				if (part2ConnectionIndex >= 0) {
					const lastPair = pairs[part2ConnectionIndex];
					part2Product = junctions[lastPair.i].x * junctions[lastPair.j].x;
				}
				// Update the current stage with the part2Product
				stages[stages.length - 1].part2Product = part2Product;
			}

			// Stop after reaching single circuit, or if we've exhausted pairs
			if (circuitCount === 1 || step >= pairs.length) {
				break;
			}

			const pair = pairs[step];
			uf.union(pair.i, pair.j);
			connections.push(pair);
			step++;
		}

		console.log('Part 1: After 1000 connections, product =', stages[Math.min(1000, stages.length - 1)].product);
		console.log('Part 2: Single circuit at connection', part2ConnectionIndex, ', product =', part2Product);

		// Three.js setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0d0d15);

		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.set(15, 15, 15);

		const renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('canvas'),
			antialias: true
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.target.set(0, 3, 0); // Shift the view down by 3 units
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.5; // Slow rotation (0.5 degrees per frame at 60fps = 30 seconds per rotation)
		controls.update();

		// Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		const pointLight1 = new THREE.PointLight(0xffffff, 0.6);
		pointLight1.position.set(10, 10, 10);
		scene.add(pointLight1);

		const pointLight2 = new THREE.PointLight(0xffffff, 0.4);
		pointLight2.position.set(-10, -10, -10);
		scene.add(pointLight2);

		// Create junction boxes (smaller)
		const junctionGeometry = new THREE.SphereGeometry(0.1, 12, 12);
		const junctionMaterial = new THREE.MeshPhongMaterial({
			color: 0x89b4fa,
			emissive: 0x89b4fa,
			emissiveIntensity: 0.2
		});

		const junctionMeshes = junctions.map((j, idx) => {
			const mesh = new THREE.Mesh(junctionGeometry, junctionMaterial);
			mesh.position.set(
				(j.x * scale) - 10,
				(j.y * scale) - 10,
				(j.z * scale) - 10
			);
			mesh.userData.index = idx;
			scene.add(mesh);
			return mesh;
		});

		// Connection lines - pre-render all cylinders (enough to reach single circuit)
		let connectionCylinders = [];
		
		// Determine how many connections we need (until single circuit)
		const maxConnections = Math.min(pairs.length, stages[stages.length - 1].connections.length);
		
		// Pre-create all connection cylinders
		console.log('Pre-rendering', maxConnections, 'connections...');
		pairs.slice(0, maxConnections).forEach((pair, idx) => {
			const j1 = junctions[pair.i];
			const j2 = junctions[pair.j];
			
			const p1 = new THREE.Vector3(
				(j1.x * scale) - 10,
				(j1.y * scale) - 10,
				(j1.z * scale) - 10
			);
			const p2 = new THREE.Vector3(
				(j2.x * scale) - 10,
				(j2.y * scale) - 10,
				(j2.z * scale) - 10
			);

			// Create cylinder between points
			const direction = new THREE.Vector3().subVectors(p2, p1);
			const length = direction.length();
			const cylinderGeometry = new THREE.CylinderGeometry(0.015, 0.015, length, 4);
			const cylinderMaterial = new THREE.MeshBasicMaterial({
				transparent: true,
				opacity: 0.8
			});
			
			const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
			
			// Position at midpoint
			cylinder.position.copy(p1).add(direction.multiplyScalar(0.5));
			
			// Orient cylinder to connect the two points
			cylinder.quaternion.setFromUnitVectors(
				new THREE.Vector3(0, 1, 0),
				direction.normalize()
			);
			
			// Initially invisible
			cylinder.visible = false;
			cylinder.userData.pairIndex = idx;
			cylinder.userData.i = pair.i;
			cylinder.userData.j = pair.j;
			
			scene.add(cylinder);
			connectionCylinders.push(cylinder);
		});
		console.log('Pre-rendering complete!');

		// Pre-generate stable colors for each junction based on their index
		const junctionColors = [];
		const hues = [];
		for (let i = 0; i < junctions.length; i++) {
			const hue = (i * 137.508) % 360; // Golden angle for good distribution
			junctionColors.push(new THREE.Color().setHSL(hue / 360, 0.8, 0.55));
		}

		function updateConnections(stage) {
			const numConnections = stage.connections.length;

			if (numConnections === 0) {
				// No connections yet - make all junctions small and hide all cylinders
				junctionMeshes.forEach(mesh => {
					mesh.scale.set(0.33, 0.33, 0.33);
					mesh.material = new THREE.MeshPhongMaterial({
						color: 0x89b4fa,
						emissive: 0x89b4fa,
						emissiveIntensity: 0.2
					});
				});
				connectionCylinders.forEach(cyl => cyl.visible = false);
				return;
			}

			// Color junctions by circuit - use lowest junction index as stable color
			const uf = new UnionFind(junctions.length);
			stage.connections.forEach(conn => uf.union(conn.i, conn.j));
			
			// Map each root to the lowest junction index in that circuit for stable colors
			const circuitColors = new Map();
			for (let i = 0; i < junctions.length; i++) {
				const root = uf.find(i);
				if (!circuitColors.has(root)) {
					// Find the lowest index in this circuit
					let lowestInCircuit = i;
					for (let j = 0; j < i; j++) {
						if (uf.find(j) === root) {
							lowestInCircuit = j;
							break;
						}
					}
					circuitColors.set(root, junctionColors[lowestInCircuit]);
				}
			}
			
			// Track which junctions are connected
			const connectedJunctions = new Set();
			stage.connections.forEach(conn => {
				connectedJunctions.add(conn.i);
				connectedJunctions.add(conn.j);
			});
			
			junctionMeshes.forEach((mesh, idx) => {
				const root = uf.find(idx);
				const color = circuitColors.get(root);
				
				mesh.material = new THREE.MeshPhongMaterial({
					color: color,
					emissive: color,
					emissiveIntensity: 0.4
				});
				
				// Make unconnected junctions smaller
				if (connectedJunctions.has(idx)) {
					mesh.scale.set(1, 1, 1);
				} else {
					mesh.scale.set(0.33, 0.33, 0.33);
				}
			});

			// Show/hide cylinders and update their colors based on current stage
			connectionCylinders.forEach((cylinder, idx) => {
				if (idx < numConnections) {
					cylinder.visible = true;
					// Update color to match circuit
					const root = uf.find(cylinder.userData.i);
					const lineColor = circuitColors.get(root);
					cylinder.material.color = lineColor;
				} else {
					cylinder.visible = false;
				}
			});
		}

		// Animation state
		let currentStage = 0;
		let isPlaying = false;
		let lastTime = 0;

		const playBtn = document.getElementById('play');
		const prevBtn = document.getElementById('prev');
		const nextBtn = document.getElementById('next');
		const resetBtn = document.getElementById('reset');
		const timelineSlider = document.getElementById('timeline');
		const timelineStep = document.getElementById('timelineStep');
		const statsInfo = document.getElementById('statsInfo');

		function updateUI() {
			const stage = stages[currentStage];
			timelineStep.textContent = \`Step \${currentStage} of \${stages.length - 1}\`;
			
			const part1Result = stages[Math.min(1000, stages.length - 1)].product;
			const part2Result = stage.part2Product || 0;
			
			statsInfo.textContent = \`Circuits: \${stage.circuits} | Largest: \${stage.largest} | Part 1: \${part1Result.toLocaleString()} | Part 2: \${part2Result.toLocaleString()}\`;
			
			prevBtn.disabled = currentStage === 0;
			nextBtn.disabled = currentStage === stages.length - 1;
			
			// Update timeline slider and gradient
			timelineSlider.value = currentStage;
			const percent = (currentStage / (stages.length - 1)) * 100;
			timelineSlider.style.background = \`linear-gradient(to right, #a6e3a1 0%, #a6e3a1 \${percent}%, #313244 \${percent}%, #313244 100%)\`;
			
			updateConnections(stage);
		}

		function goToStage(index) {
			currentStage = Math.max(0, Math.min(stages.length - 1, index));
			updateUI();
		}

		prevBtn.addEventListener('click', () => goToStage(currentStage - 1));
		nextBtn.addEventListener('click', () => goToStage(currentStage + 1));
		resetBtn.addEventListener('click', () => goToStage(0));

		// Timeline slider scrubbing
		timelineSlider.addEventListener('input', (e) => {
			goToStage(parseInt(e.target.value));
		});

		playBtn.addEventListener('click', () => {
			isPlaying = !isPlaying;
			playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
			if (isPlaying && currentStage === stages.length - 1) {
				goToStage(0);
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
		});

		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		// Animation loop
		function animate(time) {
			requestAnimationFrame(animate);

			// Auto-advance if playing (zero delay - advance every frame)
			if (isPlaying) {
				if (currentStage < stages.length - 1) {
					goToStage(currentStage + 1);
				} else {
					isPlaying = false;
					playBtn.textContent = '▶ Play';
				}
			}

			controls.update();
			renderer.render(scene, camera);
		}

		// Initialize - start at step 0
		currentStage = 0;
		updateUI();
		animate(0);
	</script>
</body>
</html>`;

await Bun.write(`${scriptDir}/index.html`, html);
console.log(`Generated index.html with ${junctions.length} junction boxes`);
