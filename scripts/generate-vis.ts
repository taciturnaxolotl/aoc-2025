#!/usr/bin/env bun

import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

const OUTPUT_DIR = join(import.meta.dir, "../output");
const VIS_DIR = join(import.meta.dir, "../vis");

console.log("🎨 Generating all visualizations...\n");

// Clean output directory
await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

// Auto-detect days from vis directory
const entries = await readdir(VIS_DIR, { withFileTypes: true });
const days = entries
	.filter((entry) => entry.isDirectory() && /^\d{2}$/.test(entry.name))
	.map((entry) => entry.name)
	.sort();

// Generate each day's visualization
for (const day of days) {
	console.log(`📊 Day ${day}...`);
	const dayDir = join(VIS_DIR, day);
	const generateScript = join(dayDir, "generate.ts");

	// Run the generator
	await $`cd ${dayDir} && bun ${generateScript}`;

	// Copy the output to the output directory
	const outputDayDir = join(OUTPUT_DIR, day);
	await mkdir(outputDayDir, { recursive: true });
	await $`cp ${join(dayDir, "index.html")} ${outputDayDir}/index.html`;

	console.log(`   ✓ Generated ${day}`);
}

// Generate index page
console.log("\n📄 Generating index page...");

// Day metadata
const dayInfo: Record<string, { title: string; description: string }> = {
	"04": {
		title: "Paper Removal",
		description:
			"Watch papers being removed layer by layer from a grid. Papers with fewer than 4 neighbors (including diagonals) are accessible and removed each iteration.",
	},
	"06": {
		title: "Cephalopod Math",
		description:
			"Learn to read numbers like a cephalopod! Part 1 reads numbers vertically down columns, Part 2 reads digits column-by-column from right to left.",
	},
	"07": {
		title: "Tachyon Beam Splitting",
		description:
			"Watch tachyon beams split as they travel through a manifold. Each splitter (^) stops a beam and creates two new beams extending left and right.",
	},
};

const dayCards = days
	.map((day) => {
		const info = dayInfo[day];
		if (!info) return "";

		return `				<li>
					<a href="${day}/index.html" class="day-item">
						<span class="day-number">Day ${parseInt(day, 10)}:</span>
						<span class="day-title">${info.title}</span>
						<span class="stars"> **</span>
					</a>
					<div class="day-description">${info.description}</div>
				</li>`;
	})
	.join("\n");

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Advent of Code 2025 - Visualizations</title>
	<style>
		body {
			background: #1e1e2e;
			color: #cdd6f4;
			font-family: "Source Code Pro", monospace;
			font-size: 14pt;
			font-weight: 300;
			padding: 1rem;
		}
		a {
			text-decoration: none;
			color: #a6e3a1;
			outline: 0;
		}
		a:hover, a:focus {
			background-color: #181825 !important;
		}
		h1, h2 {
			font-size: 1em;
			font-weight: normal;
		}
		header {
			white-space: nowrap;
			margin-bottom: 2em;
		}
		header h1 {
			display: inline-block;
			margin: 0;
			padding-right: 1em;
		}
		header h1 span {
			color: #a6e3a1;
			text-shadow: 0 0 2px #a6e3a1, 0 0 5px #a6e3a1;
		}
		main {
			width: 60em;
			margin: 0 auto;
			min-height: 76vh;
		}
		article {
			margin-bottom: 2em;
		}
		article h2 {
			color: #cdd6f4;
			margin-top: 1em;
			margin-bottom: 1em;
		}
		.days-list {
			list-style-type: none;
			padding: 0;
		}
		.day-item {
			display: block;
			padding: 0.5em 0;
			color: inherit;
		}
		.day-item:hover, .day-item:focus {
			background-color: #181825 !important;
		}
		.day-number {
			color: #a6adc8;
		}
		.day-title {
			color: #cdd6f4;
		}
		.stars {
			color: #f9e2af;
		}
		.day-description {
			color: #a6adc8;
			padding-left: 2.5em;
		}
		footer {
			margin-top: 3em;
			color: #a6adc8;
			text-align: center;
			font-size: 12px;
		}
	</style>
</head>
<body>
	<header>
		<h1><span>Advent of Code</span> 2025 - Visualizations</h1>
	</header>
	
	<main>
		<article>
			<h2>Interactive Problem Visualizations</h2>
			<ul class="days-list">
${dayCards}
			</ul>
		</article>
		
	</main>
	
	<footer>
		Made with ♥ by <a href="https://dunkirk.sh">Kieran Klukas</a>
		<br>
		<a href="https://adventofcode.com/2025">[Return to Advent of Code]</a>
	</footer>
</body>
</html>`;

await Bun.write(join(OUTPUT_DIR, "index.html"), indexHtml);

console.log("\n✨ All visualizations generated successfully!");
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log(`🌐 Open ${join(OUTPUT_DIR, "index.html")} to view\n`);
