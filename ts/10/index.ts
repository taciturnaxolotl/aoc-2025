const file = await Bun.file("../../shared/10/input.txt").text();

interface Machine {
	target: boolean[];
	buttons: number[][];
	joltages: number[];
}

// Test with examples first
const testInput = `[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}
[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}
[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}`;

function parseMachines(input: string): Machine[] {
	return input
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
			const joltages = joltagesMatch
				? joltagesMatch[1].split(",").map(Number)
				: [];

			return { target, buttons, joltages };
		});
}

function solveMachine(machine: Machine): number {
	const n = machine.target.length;
	const m = machine.buttons.length;

	// Build augmented matrix [A | b]
	const matrix: number[][] = [];
	for (let i = 0; i < n; i++) {
		const row: number[] = [];
		for (let j = 0; j < m; j++) {
			row.push(machine.buttons[j].includes(i) ? 1 : 0);
		}
		row.push(machine.target[i] ? 1 : 0);
		matrix.push(row);
	}

	// Gaussian elimination
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

	// Check for inconsistency
	for (let row = pivotCols.length; row < n; row++) {
		if (matrix[row][m] === 1) {
			return Infinity;
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

	return minPresses;
}

// Test with examples
const testMachines = parseMachines(testInput);
let testTotal = 0;
testMachines.forEach((machine, idx) => {
	const presses = solveMachine(machine);
	testTotal += presses;
});
console.log("Part 1 test total:", testTotal, "(expected: 7)");

// Now solve actual input
const machines = parseMachines(file);
let totalPresses = 0;
machines.forEach((machine, idx) => {
	const presses = solveMachine(machine);
	if (presses === Infinity) {
		console.log(`Machine ${idx} has no solution!`);
	}
	totalPresses += presses;
});

console.log("\npart 1:", totalPresses);

// Part 2: Joltage configuration

function solveMachinePart2(machine: Machine): number {
	const n = machine.joltages.length;
	const m = machine.buttons.length;
	const target = machine.joltages;

	// Build coefficient matrix A where A[i][j] = 1 if button j affects counter i
	const A: number[][] = [];
	for (let i = 0; i < n; i++) {
		const row: number[] = [];
		for (let j = 0; j < m; j++) {
			row.push(machine.buttons[j].includes(i) ? 1 : 0);
		}
		A.push(row);
	}	const solution = new Array(m).fill(0);
	const current = new Array(n).fill(0);

	// Simple greedy: for each counter that needs more, press any button that affects it
	// Better approach: try to find the exact solution using integer linear programming

	// For small cases, we can use Gaussian elimination to find one solution,
	// then check if it's all non-negative integers
	// Otherwise, use a more sophisticated approach

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

	// Check for inconsistency
	for (let row = pivotCols.length; row < n; row++) {
		if (Math.abs(matrix[row][m]) > 1e-9) {
			return Infinity;
		}
	}

	// Identify free variables
	const isPivot = new Array(m).fill(false);
	pivotCols.forEach((col) => (isPivot[col] = true));
	const freeVars: number[] = [];
	for (let j = 0; j < m; j++) {
		if (!isPivot[j]) freeVars.push(j);
	}

	// Search all combinations of free variables to find minimum
	if (freeVars.length > 15) {
		return Infinity;
		return Infinity;
	}

	let minPresses = Infinity;
	let bestSolution: number[] = [];

	// Estimate upper bound for free variables based on target values
	const maxTarget = Math.max(...target);
	const maxFreeValue = Math.min(maxTarget * 2, 200);

	function searchFreeVars(idx: number, currentSol: number[]) {
		if (idx === freeVars.length) {
			// Back-substitute to get pivot variables
			const sol = [...currentSol];
			let valid = true;
			for (let i = pivotCols.length - 1; i >= 0; i--) {
				const col = pivotCols[i];
				let val = matrix[i][m];
				for (let j = col + 1; j < m; j++) {
					val -= matrix[i][j] * sol[j];
				}
				sol[col] = val;

				// Check if it's a non-negative integer
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

		// Try different values for this free variable
		for (let val = 0; val <= maxFreeValue; val++) {
			currentSol[freeVars[idx]] = val;
			searchFreeVars(idx + 1, currentSol);
		}
	}

	searchFreeVars(0, new Array(m).fill(0));

	return minPresses;
}

// Test Part 2 examples
const testInput2 = `[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}
[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}
[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}`;

const testMachines2 = parseMachines(testInput2);
let testTotal2 = 0;
testMachines2.forEach((machine, idx) => {
	const presses = solveMachinePart2(machine);
	testTotal2 += presses;
});
console.log("Part 2 test total:", testTotal2, "(expected: 33)");

// Solve Part 2 for actual input
let totalPresses2 = 0;
machines.forEach((machine, idx) => {
	const presses = solveMachinePart2(machine);
	if (presses === Infinity) {
		console.log(`Machine ${idx} has no solution!`);
	}
	totalPresses2 += presses;
});

console.log("\npart 2:", totalPresses2);
