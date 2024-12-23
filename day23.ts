import { assert } from '@std/assert/assert';
import { Graph, Node } from './lib/graph.ts';
import { Sequence } from './lib/sequence.ts';
import { type MainArgs, parseFile } from './lib/utils.ts';

type Parsed = [from: string, to: string][];

function part1(inp: Parsed): number {
  const g = new Graph<undefined, undefined, string>();
  for (const [from, to] of inp) {
    g.addLink(from, to);
  }

  let tot = 0;
  const seen = new Set<string>();
  for (const t of g.nodes()) {
    if (t.id.startsWith('t')) {
      const links = t.links;
      if (links) {
        for (const [a, b] of new Sequence(links).combinations(2)) {
          const [aid, bid] = [a.otherId(t.id), b.otherId(t.id)];
          if (g.getLink(aid, bid) || g.getLink(bid, aid)) {
            const trip = String([t.id, aid, bid].sort());
            if (!seen.has(trip)) {
              tot++;
              seen.add(trip);
            }
          }
        }
      }
    }
  }
  return tot;
}

type Nd = Node<undefined, undefined, string>;
type Snd = Set<Nd>;
type Gnd = Graph<undefined, undefined, string>;

// See: https://en.wikipedia.org/wiki/Bron%E2%80%93Kerbosch_algorithm
// There are several ideas to make this faster there, and we could also
// switch to sets of integers as well.
function BronKerbosch1(g: Gnd, R: Snd, P: Snd, X: Snd): Snd[] {
  const cliques: Snd[] = [];
  if ((P.size === 0) && (X.size === 0)) {
    cliques.push(new Set(R));
  }
  for (const v of P) {
    const N = new Set(
      g.linkedNodes(v).map(([from, _link, to]) => v === from ? to : from),
    );
    cliques.push(...BronKerbosch1(
      g,
      R.union(new Set([v])),
      P.intersection(N),
      X.intersection(N),
    ));
    P.delete(v);
    X.add(v);
  }

  return cliques;
}

function part2(inp: Parsed): string {
  const g = new Graph<undefined, undefined, string>();
  for (const [from, to] of inp) {
    g.addLink(from, to);
  }

  const P = new Set(g.nodes());
  const res = BronKerbosch1(g, new Set<Nd>(), P, new Set<Nd>());
  const [_maxSize, maxClique] = res.reduce<[number, Snd | null]>(
    (t, clique) => (clique.size > t[0]) ? [clique.size, clique] : t,
    [-Infinity, null],
  );

  assert(maxClique);
  return [...maxClique.values().map((n) => n.id)].sort().join(',');
}

export default async function main(args: MainArgs): Promise<[number, string]> {
  const inp = await parseFile<Parsed>(args);
  return [part1(inp), part2(inp)];
}
