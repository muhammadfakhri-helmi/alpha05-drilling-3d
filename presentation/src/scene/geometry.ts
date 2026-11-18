/**
 * Geometry builders along the trajectory.
 *
 * Cutaway convention: the well is cut by the section plane z = 0 and the half
 * facing the viewer is removed. Tubulars are drawn as BACK half-shells
 * (z <= 0); walls and cement are drawn as flat ribbons in the cut plane, so
 * the nested strings read like the casing schematic in the deck.
 */
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { posAt, normalAt, tangentAt, sampleMDs } from '../data/trajectory.ts';

/** Back half-shell of radius r between two MDs. */
export function halfShell(mdA: number, mdB: number, r: number, seg = 14): BufferGeometry {
  const mds = sampleMDs(mdA, mdB);
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  for (const md of mds) {
    const [px, py] = posAt(md);
    const [nx, ny] = normalAt(md);
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI;
      const c = Math.cos(th), s = Math.sin(th);
      // in-plane component along the normal, out-of-plane towards -z
      const ox = nx * c * r, oy = ny * c * r, oz = -s * r;
      pos.push(px + ox, py + oy, oz);
      nor.push(-nx * c, -ny * c, s); // inward-facing normal: we look at the inside of the shell
    }
  }
  const row = seg + 1;
  for (let i = 0; i < mds.length - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * row + j, b = a + row;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/**
 * Flat ribbon(s) in the cut plane between radii rIn and rOut, on both sides of
 * the axis (or one side). z lifts the ribbon slightly towards the viewer.
 */
export function ribbon(mdA: number, mdB: number, rIn: number, rOut: number, z = 0, sides: (1 | -1)[] = [1, -1]): BufferGeometry {
  const mds = sampleMDs(mdA, mdB);
  const pos: number[] = [], idx: number[] = [];
  let base = 0;
  for (const side of sides) {
    for (const md of mds) {
      const [px, py] = posAt(md);
      const [nx, ny] = normalAt(md);
      pos.push(px + nx * rIn * side, py + ny * rIn * side, z, px + nx * rOut * side, py + ny * rOut * side, z);
    }
    for (let i = 0; i < mds.length - 1; i++) {
      const a = base + i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    base += mds.length * 2;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Casing-shoe triangles (schematic symbol) at an MD, pointing outward on both sides. */
export function shoeTriangles(md: number, r: number, size: number, z = 0): BufferGeometry {
  const [px, py] = posAt(md);
  const [nx, ny] = normalAt(md);
  const [tx, ty] = tangentAt(md);
  const pos: number[] = [];
  for (const side of [1, -1]) {
    const bx = px + nx * r * side, by = py + ny * r * side;
    // triangle: on the wall at the shoe, outward foot, and up the wall
    pos.push(bx, by, z, bx + nx * size * side, by + ny * size * side, z, bx - tx * size * 1.6, by - ty * size * 1.6, z);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Points along the axis (for lines). offset moves the line sideways along the normal. */
export function axisPoints(mdA: number, mdB: number, offset = 0, z = 0, step = 30): Vector3[] {
  return sampleMDs(mdA, mdB, step, 300).map((md) => {
    const [px, py] = posAt(md);
    const [nx, ny] = normalAt(md);
    return new Vector3(px + nx * offset, py + ny * offset, z);
  });
}

export const v3 = (p: [number, number, number]) => new Vector3(p[0], p[1], p[2]);

/** Full tube of radius r between two MDs (drill string, BHA). */
export function tube(mdA: number, mdB: number, r: number, seg = 12): BufferGeometry {
  const mds = sampleMDs(mdA, mdB);
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  for (const md of mds) {
    const [px, py] = posAt(md);
    const [nx, ny] = normalAt(md);
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      pos.push(px + nx * c * r, py + ny * c * r, s * r);
      nor.push(nx * c, ny * c, s);
    }
  }
  const row = seg + 1;
  for (let i = 0; i < mds.length - 1; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * row + j, b = a + row;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}
