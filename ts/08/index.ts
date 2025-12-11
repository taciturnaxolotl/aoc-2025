const file = await Bun.file("../../shared/08/input.txt").text();

// Parse junction coordinates
const junctions = file
  .trim()
  .split("\n")
  .map((line) => {
    const [x, y, z] = line.split(",").map(Number);
    return { x, y, z };
  });

// Calculate distance between two junctions
function distance(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

// Generate all pairs with distances
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

// Union-Find data structure
class UnionFind {
  parent: number[];
  size: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = Array(n).fill(1);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
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

  getCircuitSizes(): number[] {
    const circuits = new Map<number, number>();
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      circuits.set(root, this.size[root]);
    }
    return Array.from(circuits.values()).sort((a, b) => b - a);
  }

  getCircuitCount(): number {
    const roots = new Set<number>();
    for (let i = 0; i < this.parent.length; i++) {
      roots.add(this.find(i));
    }
    return roots.size;
  }
}

(() => {
  // Part 1: After 1000 connections, product of top 3 circuit sizes
  const uf = new UnionFind(junctions.length);

  for (let i = 0; i < 1000; i++) {
    uf.union(pairs[i].i, pairs[i].j);
  }

  const circuitSizes = uf.getCircuitSizes();
  const top3 = circuitSizes.slice(0, 3);
  const product = top3[0] * top3[1] * top3[2];

  console.log("part 1:", product);
})();

(() => {
  // Part 2: Find when all junctions form a single circuit
  const uf = new UnionFind(junctions.length);

  for (let i = 0; i < pairs.length; i++) {
    uf.union(pairs[i].i, pairs[i].j);

    if (uf.getCircuitCount() === 1) {
      // Found the connection that unified everything
      const pair = pairs[i];
      const product = junctions[pair.i].x * junctions[pair.j].x;
      console.log("part 2:", product);
      break;
    }
  }
})();
