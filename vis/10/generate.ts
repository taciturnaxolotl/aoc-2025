const scriptDir = import.meta.dir;
const file = await Bun.file(`${scriptDir}/../../shared/10/input.txt`).text();

interface Machine {
	target: boolean[];
	buttons: number[][];
	joltages: number[];
}

// Parse input
const machines: Machine[] = file
	.trim()
	.split("\n")
	.map((line) => {
		const lightsMatch = line.match(/\[([.#]+)\]/);
		const target = lightsMatch![1].split("").map((c) => c === "#");

		const buttonsMatch = line.matchAll(/\(([0-9,]+)\)/g);
		const buttons: number[][] = [];
		for (const match of buttonsMatch) {
			const indices = match[1].split(",").map(Number);
			buttons.push(indices);
		}

		const joltagesMatch = line.match(/\{([0-9,]+)\}/);
		const joltages = joltagesMatch ? joltagesMatch[1].split(",").map(Number) : [];

		return { target, buttons, joltages };
	});

// Solve one machine
function solveMachine(machine: Machine): { solution: number[]; steps: any[] } {
	const n = machine.target.length;
	const m = machine.buttons.length;

	const matrix: number[][] = [];
	for (let i = 0; i < n; i++) {
		const row: number[] = [];
		for (let j = 0; j < m; j++) {
			row.push(machine.buttons[j].includes(i) ? 1 : 0);
		}
		row.push(machine.target[i] ? 1 : 0);
		matrix.push(row);
	}

	const steps = [JSON.parse(JSON.stringify(matrix))];
	const pivotCols: number[] = [];

	for (let col = 0; col < m; col++) {
		let pivotRow = -1;
		for (let row = pivotCols.length; row < n; row++) {
			if (matrix[row][col] === 1) {
				pivotRow = row;
				break;
			}
		}

		if (pivotRow === -1) continue;

		const targetRow = pivotCols.length;
		if (pivotRow !== targetRow) {
			[matrix[pivotRow], matrix[targetRow]] = [
				matrix[targetRow],
				matrix[pivotRow],
			];
			steps.push(JSON.parse(JSON.stringify(matrix)));
		}

		pivotCols.push(col);

		for (let row = 0; row < n; row++) {
			if (row !== targetRow && matrix[row][col] === 1) {
				for (let c = 0; c <= m; c++) {
					matrix[row][c] ^= matrix[targetRow][c];
				}
				steps.push(JSON.parse(JSON.stringify(matrix)));
			}
		}
	}

	// Identify free variables
	const isPivot = new Array(m).fill(false);
	pivotCols.forEach((col) => (isPivot[col] = true));
	const freeVars: number[] = [];
	for (let j = 0; j < m; j++) {
		if (!isPivot[j]) freeVars.push(j);
	}

	// Try all combinations of free variables to find minimum
	let minPresses = Infinity;
	let bestSolution: number[] = [];

	const numCombinations = 1 << freeVars.length;
	for (let combo = 0; combo < numCombinations; combo++) {
		const solution: number[] = new Array(m).fill(0);

		// Set free variables according to combo
		for (let i = 0; i < freeVars.length; i++) {
			solution[freeVars[i]] = (combo >> i) & 1;
		}

		// Back-substitution for pivot variables
		for (let i = pivotCols.length - 1; i >= 0; i--) {
			const col = pivotCols[i];
			solution[col] = matrix[i][m];

			for (let j = col + 1; j < m; j++) {
				if (matrix[i][j] === 1) {
					solution[col] ^= solution[j];
				}
			}
		}

		const presses = solution.reduce((sum, x) => sum + x, 0);
		if (presses < minPresses) {
			minPresses = presses;
			bestSolution = solution;
		}
	}

	return { solution: bestSolution, steps };
}

// Solve Part 2: joltage configuration
function solveMachinePart2(machine: Machine): number[] {
	const n = machine.joltages.length;
	const m = machine.buttons.length;
	const target = machine.joltages;

	// Build coefficient matrix A
	const A: number[][] = [];
	for (let i = 0; i < n; i++) {
		const row: number[] = [];
		for (let j = 0; j < m; j++) {
			row.push(machine.buttons[j].includes(i) ? 1 : 0);
		}
		A.push(row);
	}

	// Build augmented matrix [A | b]
	const matrix: number[][] = [];
	for (let i = 0; i < n; i++) {
		matrix.push([...A[i], target[i]]);
	}

	// Gaussian elimination
	const pivotCols: number[] = [];
	for (let col = 0; col < m; col++) {
		let pivotRow = -1;
		for (let row = pivotCols.length; row < n; row++) {
			if (matrix[row][col] !== 0) {
				pivotRow = row;
				break;
			}
		}

		if (pivotRow === -1) continue;

		const targetRow = pivotCols.length;
		if (pivotRow !== targetRow) {
			[matrix[pivotRow], matrix[targetRow]] = [
				matrix[targetRow],
				matrix[pivotRow],
			];
		}

		pivotCols.push(col);

		// Scale row so pivot is 1
		const pivot = matrix[targetRow][col];
		for (let c = 0; c <= m; c++) {
			matrix[targetRow][c] /= pivot;
		}

		// Eliminate column in other rows
		for (let row = 0; row < n; row++) {
			if (row !== targetRow && matrix[row][col] !== 0) {
				const factor = matrix[row][col];
				for (let c = 0; c <= m; c++) {
					matrix[row][c] -= factor * matrix[targetRow][c];
				}
			}
		}
	}

	// Identify free variables
	const isPivot = new Array(m).fill(false);
	pivotCols.forEach((col) => (isPivot[col] = true));
	const freeVars: number[] = [];
	for (let j = 0; j < m; j++) {
		if (!isPivot[j]) freeVars.push(j);
	}

	if (freeVars.length > 15) {
		return new Array(m).fill(0);
	}

	let minPresses = Infinity;
	let bestSolution: number[] = [];

	const maxTarget = Math.max(...target);
	const maxFreeValue = Math.min(maxTarget * 2, 200);

	function searchFreeVars(idx: number, currentSol: number[]) {
		if (idx === freeVars.length) {
			const sol = [...currentSol];
			let valid = true;
			for (let i = pivotCols.length - 1; i >= 0; i--) {
				const col = pivotCols[i];
				let val = matrix[i][m];
				for (let j = col + 1; j < m; j++) {
					val -= matrix[i][j] * sol[j];
				}
				sol[col] = val;

				if (val < -1e-9 || Math.abs(val - Math.round(val)) > 1e-9) {
					valid = false;
					break;
				}
			}

			if (valid) {
				const intSol = sol.map((x) => Math.round(Math.max(0, x)));
				const presses = intSol.reduce((sum, x) => sum + x, 0);
				if (presses < minPresses) {
					minPresses = presses;
					bestSolution = intSol;
				}
			}
			return;
		}

		for (let val = 0; val <= maxFreeValue; val++) {
			currentSol[freeVars[idx]] = val;
			searchFreeVars(idx + 1, currentSol);
		}
	}

	searchFreeVars(0, new Array(m).fill(0));

	return bestSolution;
}

const machinesData = JSON.stringify(machines);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AoC 2025 Day 10 - Factory</title>
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
			max-width: 1200px;
			border-radius: 4px;
			width: 100%;
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
			border-radius: 3px;
		}
		.speed-control input[type="range"]::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 14px;
			height: 14px;
			background: #a6e3a1;
			cursor: pointer;
			border-radius: 50%;
			border: 1px solid #313244;
		}
		.speed-control input[type="range"]::-moz-range-thumb {
			width: 14px;
			height: 14px;
			background: #a6e3a1;
			cursor: pointer;
			border-radius: 50%;
			border: 1px solid #313244;
		}
		.machine-display {
			background: #11111b;
			border: 1px solid #313244;
			padding: 20px;
			margin: 20px 0;
			max-width: 1200px;
			border-radius: 4px;
			width: 100%;
		}
		.lights {
			display: flex;
			gap: 10px;
			justify-content: center;
			margin: 20px 0;
			flex-wrap: wrap;
		}
		.light {
			width: 50px;
			height: 50px;
			border-radius: 50%;
			border: 2px solid #313244;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			font-size: 9px;
			transition: all 0.3s ease;
			overflow: hidden;
			text-align: center;
			padding: 3px;
			line-height: 1.1;
		}
		.light.off {
			background: #1e1e2e;
			color: #6c7086;
		}
		.light.on {
			background: #a6e3a1;
			color: #1e1e2e;
			box-shadow: 0 0 10px #a6e3a1;
		}
		.light.target {
			border-color: #f9e2af;
			border-width: 3px;
		}
		.buttons-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
			gap: 10px;
			margin: 20px 0;
		}
		.button-display {
			background: #181825;
			border: 1px solid #313244;
			padding: 10px;
			border-radius: 4px;
			text-align: center;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.button-display:hover {
			background: #313244;
		}
		.button-display.pressed {
			background: #a6e3a1;
			color: #1e1e2e;
			border-color: #a6e3a1;
		}
		.button-label {
			font-size: 12px;
			margin-bottom: 5px;
			color: #a6adc8;
		}
		.button-toggles {
			font-size: 11px;
			color: #6c7086;
		}
		.stats {
			background: #11111b;
			border: 1px solid #313244;
			padding: 10px 15px;
			margin: 10px 0;
			max-width: 1200px;
			border-radius: 4px;
			text-align: center;
			font-size: 13px;
			color: #a6adc8;
			width: 100%;
			margin-top: auto;
		}
		.info {
			margin: 10px 0;
			text-align: center;
			color: #f9e2af;
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
	<h1>AoC 2025 Day 10 - Factory Machines</h1>
	
	<div class="controls">
		<div class="control-row">
			<button id="togglePart" style="color: #f9e2af; font-weight: bold;">Part 1</button>
			<button id="prev">← Previous Machine</button>
			<button id="play">▶ Play</button>
			<button id="next">Next Machine →</button>
			<button id="reset">↺ Reset</button>
			<div class="speed-control">
				<label for="speed">Speed:</label>
				<input type="range" id="speed" min="1" max="25" value="5" step="1">
				<span id="speedValue">5x</span>
			</div>
		</div>
	</div>

	<div class="info" id="machineInfo">Machine 1 / ${machines.length}</div>

	<div class="machine-display">
		<h2 id="displayTitle" style="text-align: center; color: #89b4fa; font-size: 18px; margin-bottom: 20px;">Indicator Lights</h2>
		<div class="lights" id="lights"></div>
		
		<h2 style="text-align: center; color: #89b4fa; font-size: 18px; margin: 30px 0 20px 0;">Buttons</h2>
		<div class="buttons-grid" id="buttons"></div>
	</div>

	<div class="stats">
		<div id="statsInfo">Buttons Pressed: 0 | Target: ? | Accumulated Total: 0</div>
		<div style="margin-top: 5px; font-size: 11px;"><a href="../index.html">[Return to Index]</a></div>
	</div>

	<script type="module">
		const machines = ${machinesData};
		
		let currentMode = 1; // 1 or 2
		let currentMachineIndex = 0;
		let currentState = [];
		let buttonStates = []; // Track which buttons are "on" (pressed odd number of times)
		let isPlaying = false;
		let showingSolution = false;
		let solutionSteps = [];
		let currentStep = 0;
		let solvedMachines = new Set(); // Track which machines have been solved
		let animationSpeed = 200; // ms between button presses (default 5x)


		function renderMachine() {
			const machine = machines[currentMachineIndex];
			
			// Update title based on mode
			const titleEl = document.getElementById('displayTitle');
			if (currentMode === 1) {
				titleEl.textContent = 'Indicator Lights';
				titleEl.style.color = '#89b4fa';
			} else {
				titleEl.textContent = 'Joltage Counters';
				titleEl.style.color = '#f9e2af';
			}
			
			// Render lights or counters
			const lightsDiv = document.getElementById('lights');
			lightsDiv.innerHTML = '';
			
			if (currentMode === 1) {
				// Part 1: Indicator lights
				machine.target.forEach((target, i) => {
					const light = document.createElement('div');
					light.className = \`light \${currentState[i] ? 'on' : 'off'} \${target ? 'target' : ''}\`;
					light.textContent = i;
					lightsDiv.appendChild(light);
				});
			} else {
				// Part 2: Joltage counters
				machine.joltages.forEach((target, i) => {
					const counter = document.createElement('div');
					const current = currentState[i] || 0;
					const isTarget = current === target;
					counter.className = \`light \${isTarget ? 'on' : 'off'} \${true ? 'target' : ''}\`;
					counter.innerHTML = \`<div style="font-size: 7px; opacity: 0.7;">[\${i}]</div><div style="font-size: 10px; font-weight: bold;">\${current}/<span style="color: #f9e2af;">\${target}</span></div>\`;
					lightsDiv.appendChild(counter);
				});
			}

			// Render buttons
			const buttonsDiv = document.getElementById('buttons');
			buttonsDiv.innerHTML = '';
			machine.buttons.forEach((toggles, i) => {
				const btn = document.createElement('div');
				const pressCount = buttonStates[i] || 0;
				const isPressed = currentMode === 1 ? (pressCount % 2 === 1) : (pressCount > 0);
				btn.className = \`button-display \${isPressed ? 'pressed' : ''}\`;
				btn.innerHTML = \`
					<div class="button-label">Button \${i}\${currentMode === 2 ? \` (\${pressCount})\` : ''}</div>
					<div class="button-toggles">Affects: \${toggles.join(', ')}</div>
				\`;
				btn.addEventListener('click', () => toggleButton(i));
				buttonsDiv.appendChild(btn);
			});
		}

		function toggleButton(buttonIndex) {
			const machine = machines[currentMachineIndex];
			
			if (currentMode === 1) {
				// Part 1: Toggle lights (XOR)
				buttonStates[buttonIndex] = buttonStates[buttonIndex] ? 0 : 1;
				machine.buttons[buttonIndex].forEach(lightIndex => {
					currentState[lightIndex] = !currentState[lightIndex];
				});
			} else {
				// Part 2: Increment counters
				buttonStates[buttonIndex] = (buttonStates[buttonIndex] || 0) + 1;
				machine.buttons[buttonIndex].forEach(counterIndex => {
					currentState[counterIndex] = (currentState[counterIndex] || 0) + 1;
				});
			}
			
			renderMachine();
			updateStats();
		}

		function solveMachine(machine) {
			const n = machine.target.length;
			const m = machine.buttons.length;

			const matrix = [];
			for (let i = 0; i < n; i++) {
				const row = [];
				for (let j = 0; j < m; j++) {
					row.push(machine.buttons[j].includes(i) ? 1 : 0);
				}
				row.push(machine.target[i] ? 1 : 0);
				matrix.push(row);
			}

			const pivotCols = [];
			for (let col = 0; col < m; col++) {
				let pivotRow = -1;
				for (let row = pivotCols.length; row < n; row++) {
					if (matrix[row][col] === 1) {
						pivotRow = row;
						break;
					}
				}

				if (pivotRow === -1) continue;

				const targetRow = pivotCols.length;
				if (pivotRow !== targetRow) {
					[matrix[pivotRow], matrix[targetRow]] = [matrix[targetRow], matrix[pivotRow]];
				}

				pivotCols.push(col);

				for (let row = 0; row < n; row++) {
					if (row !== targetRow && matrix[row][col] === 1) {
						for (let c = 0; c <= m; c++) {
							matrix[row][c] ^= matrix[targetRow][c];
						}
					}
				}
			}

			const solution = new Array(m).fill(0);
			for (let i = pivotCols.length - 1; i >= 0; i--) {
				const col = pivotCols[i];
				solution[col] = matrix[i][m];
				for (let j = col + 1; j < m; j++) {
					if (matrix[i][j] === 1) {
						solution[col] ^= solution[j];
					}
				}
			}

			return solution;
		}

		// Part 2 solver (copy of server-side logic)
		function solveMachinePart2(machine) {
			const n = machine.joltages.length;
			const m = machine.buttons.length;
			const target = machine.joltages;

			const A = [];
			for (let i = 0; i < n; i++) {
				const row = [];
				for (let j = 0; j < m; j++) {
					row.push(machine.buttons[j].includes(i) ? 1 : 0);
				}
				A.push(row);
			}

			const matrix = [];
			for (let i = 0; i < n; i++) {
				matrix.push([...A[i], target[i]]);
			}

			const pivotCols = [];
			for (let col = 0; col < m; col++) {
				let pivotRow = -1;
				for (let row = pivotCols.length; row < n; row++) {
					if (matrix[row][col] !== 0) {
						pivotRow = row;
						break;
					}
				}

				if (pivotRow === -1) continue;

				const targetRow = pivotCols.length;
				if (pivotRow !== targetRow) {
					[matrix[pivotRow], matrix[targetRow]] = [matrix[targetRow], matrix[pivotRow]];
				}

				pivotCols.push(col);

				const pivot = matrix[targetRow][col];
				for (let c = 0; c <= m; c++) {
					matrix[targetRow][c] /= pivot;
				}

				for (let row = 0; row < n; row++) {
					if (row !== targetRow && matrix[row][col] !== 0) {
						const factor = matrix[row][col];
						for (let c = 0; c <= m; c++) {
							matrix[row][c] -= factor * matrix[targetRow][c];
						}
					}
				}
			}

			const isPivot = new Array(m).fill(false);
			pivotCols.forEach(col => isPivot[col] = true);
			const freeVars = [];
			for (let j = 0; j < m; j++) {
				if (!isPivot[j]) freeVars.push(j);
			}

			if (freeVars.length > 8) { // Reduced limit for browser
				return new Array(m).fill(0);
			}

			let minPresses = Infinity;
			let bestSolution = [];

			const maxTarget = Math.max(...target);
			const maxFreeValue = Math.min(maxTarget * 2, 100);

			function searchFreeVars(idx, currentSol) {
				if (idx === freeVars.length) {
					const sol = [...currentSol];
					let valid = true;
					for (let i = pivotCols.length - 1; i >= 0; i--) {
						const col = pivotCols[i];
						let val = matrix[i][m];
						for (let j = col + 1; j < m; j++) {
							val -= matrix[i][j] * sol[j];
						}
						sol[col] = val;

						if (val < -1e-9 || Math.abs(val - Math.round(val)) > 1e-9) {
							valid = false;
							break;
						}
					}

					if (valid) {
						const intSol = sol.map(x => Math.round(Math.max(0, x)));
						const presses = intSol.reduce((sum, x) => sum + x, 0);
						if (presses < minPresses) {
							minPresses = presses;
							bestSolution = intSol;
						}
					}
					return;
				}

				for (let val = 0; val <= maxFreeValue; val++) {
					currentSol[freeVars[idx]] = val;
					searchFreeVars(idx + 1, currentSol);
				}
			}

			searchFreeVars(0, new Array(m).fill(0));
			return bestSolution;
		}

		function getCurrentSolution() {
			const machine = machines[currentMachineIndex];
			return currentMode === 1 ? solveMachine(machine) : solveMachinePart2(machine);
		}

		function showSolution() {
			const machine = machines[currentMachineIndex];
			const solution = getCurrentSolution();
			
			if (currentMode === 1) {
				currentState = new Array(machine.target.length).fill(false);
				buttonStates = [...solution].map(v => v === 1);
				
				solution.forEach((shouldPress, buttonIndex) => {
					if (shouldPress === 1) {
						machine.buttons[buttonIndex].forEach(lightIndex => {
							currentState[lightIndex] = !currentState[lightIndex];
						});
					}
				});
			} else {
				currentState = new Array(machine.joltages.length).fill(0);
				buttonStates = [...solution];
				
				solution.forEach((pressCount, buttonIndex) => {
					for (let p = 0; p < pressCount; p++) {
						machine.buttons[buttonIndex].forEach(counterIndex => {
							currentState[counterIndex]++;
						});
					}
				});
			}
			
			showingSolution = true;
			renderMachine();
			updateStats();
		}

		function updateStats() {
			const machine = machines[currentMachineIndex];
			const solution = getCurrentSolution();
			const minPresses = solution.reduce((a, b) => a + b, 0);
			
			let totalPressed;
			if (currentMode === 1) {
				totalPressed = buttonStates.filter(b => b).length;
			} else {
				totalPressed = buttonStates.reduce((sum, count) => sum + (count || 0), 0);
			}
			
			// Calculate accumulated total for solved machines
			let accumulatedTotal = 0;
			solvedMachines.forEach(idx => {
				const m = machines[idx];
				const sol = currentMode === 1 ? solveMachine(m) : solveMachinePart2(m);
				accumulatedTotal += sol.reduce((a, b) => a + b, 0);
			});
			
			document.getElementById('statsInfo').textContent = \`Buttons Pressed: \${totalPressed} | Target: \${minPresses} | Accumulated Total: \${accumulatedTotal}\`;
			document.getElementById('machineInfo').textContent = \`Machine \${currentMachineIndex + 1} / \${machines.length}\`;
		}

		document.getElementById('prev').addEventListener('click', () => {
			if (currentMachineIndex > 0) {
				isPlaying = false;
				document.getElementById('play').textContent = '▶ Play';
				currentMachineIndex--;
				initMachine();
			}
		});

		document.getElementById('next').addEventListener('click', () => {
			if (currentMachineIndex < machines.length - 1) {
				isPlaying = false;
				document.getElementById('play').textContent = '▶ Play';
				currentMachineIndex++;
				initMachine();
			}
		});

		document.getElementById('reset').addEventListener('click', initMachine);

		document.getElementById('togglePart').addEventListener('click', () => {
			currentMode = currentMode === 1 ? 2 : 1;
			document.getElementById('togglePart').textContent = \`Part \${currentMode}\`;
			solvedMachines.clear();
			initMachine();
		});

		document.getElementById('play').addEventListener('click', () => {
			isPlaying = !isPlaying;
			document.getElementById('play').textContent = isPlaying ? '⏸ Pause' : '▶ Play';
			if (isPlaying) {
				animateSolution();
			}
		});

		// Speed control
		const speedSlider = document.getElementById('speed');
		const speedValue = document.getElementById('speedValue');
		speedSlider.addEventListener('input', (e) => {
			const speed = parseInt(e.target.value);
			speedValue.textContent = \`\${speed}x\`;
			// Faster speed = shorter delay (inverse relationship)
			animationSpeed = 1000 / speed;
		});

		function animateSolution() {
			if (!isPlaying) return;
			
			if (currentStep < solutionSteps.length) {
				// Toggle the next button in the solution
				const buttonIndex = solutionSteps[currentStep];
				toggleButton(buttonIndex);
				currentStep++;
				
				// Use 10x faster speed for Part 2 (more button presses)
				const delay = currentMode === 2 ? animationSpeed / 10 : animationSpeed;
				setTimeout(animateSolution, delay);
			} else {
				// Mark this machine as solved
				const machine = machines[currentMachineIndex];
				let isCorrect;
				if (currentMode === 1) {
					isCorrect = currentState.every((state, i) => state === machine.target[i]);
				} else {
					isCorrect = currentState.every((state, i) => state === machine.joltages[i]);
				}
				
				if (isCorrect) {
					solvedMachines.add(currentMachineIndex);
					updateStats();
				}
				
				// Current machine done, move to next immediately
				if (currentMachineIndex < machines.length - 1) {
					if (isPlaying) {
						currentMachineIndex++;
						initMachine();
						setTimeout(animateSolution, animationSpeed);
					}
				} else {
					// All done
					isPlaying = false;
					document.getElementById('play').textContent = '▶ Play';
					setTimeout(() => {
						currentMachineIndex = 0;
						initMachine();
					}, animationSpeed * 4);
				}
			}
		}

		function initMachine() {
			const machine = machines[currentMachineIndex];
			showingSolution = false;
			currentStep = 0;
			
			if (currentMode === 1) {
				// Part 1
				currentState = new Array(machine.target.length).fill(false);
				buttonStates = new Array(machine.buttons.length).fill(0);
				
				const solution = solveMachine(machine);
				solutionSteps = [];
				solution.forEach((shouldPress, idx) => {
					if (shouldPress === 1) {
						solutionSteps.push(idx);
					}
				});
			} else {
				// Part 2
				currentState = new Array(machine.joltages.length).fill(0);
				buttonStates = new Array(machine.buttons.length).fill(0);
				
				const solution = solveMachinePart2(machine);
				solutionSteps = [];
				solution.forEach((pressCount, idx) => {
					for (let i = 0; i < pressCount; i++) {
						solutionSteps.push(idx);
					}
				});
			}
			
			renderMachine();
			updateStats();
		}

		// Initialize
		initMachine();
	</script>
</body>
</html>`;

await Bun.write(`${scriptDir}/index.html`, html);
