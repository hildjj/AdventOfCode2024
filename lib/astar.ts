/**
 * Performs a uni-directional A Star search on graph.
 *
 * We will try to minimize f(n) = g(n) + h(n), where
 * g(n) is actual distance from source node to `n`, and
 * h(n) is heuristic distance from `n` to target node.
 */
import { BinaryHeap } from '@std/data-structures';
import type { Graph, Link, Node } from './graph.ts';
import { type NodeSearchState, StatePool } from './pool.ts';

// var defaultSettings = require('./defaultSettings.js');

export const NO_PATH = Symbol('NO_PATH');
export { type NodeSearchState } from './pool.ts';

// module.exports.l2 = heuristics.l2;
// module.exports.l1 = heuristics.l1;

export interface AstarOptions<
  NodeData,
  LinkData,
  NodeId extends string | number,
> {
  blocked?: (
    a: Node<NodeData, LinkData, NodeId>,
    b: Node<NodeData, LinkData, NodeId>,
    l: Link<LinkData, NodeId>,
  ) => boolean;
  blockedPath?: (
    cameFrom: NodeSearchState<NodeData, LinkData, NodeId>,
    state: NodeSearchState<NodeData, LinkData, NodeId>,
    l: Link<LinkData, NodeId>,
  ) => boolean;
  heuristic?: (
    a: Node<NodeData, LinkData, NodeId>,
    b: Node<NodeData, LinkData, NodeId>,
  ) => number;
  distance?: (
    a: Node<NodeData, LinkData, NodeId>,
    b: Node<NodeData, LinkData, NodeId>,
    link: Link<LinkData, NodeId>,
  ) => number;
  compare?: (
    a: NodeSearchState<NodeData, LinkData, NodeId>,
    b: NodeSearchState<NodeData, LinkData, NodeId>,
  ) => number;
  oriented?: boolean;
}

/**
 * Creates a new instance of pathfinder.
 *
 * @param graph instance. See https://github.com/anvaka/ngraph.graph
 * @param options configures search
 */
export class Astar<NodeData, LinkData, NodeId extends string | number> {
  #opts: Required<AstarOptions<NodeData, LinkData, NodeId>>;
  #graph: Graph<NodeData, LinkData, NodeId>;
  #pool: StatePool<NodeData, LinkData, NodeId>;

  constructor(
    graph: Graph<NodeData, LinkData, NodeId>,
    options: AstarOptions<NodeData, LinkData, NodeId> = {},
  ) {
    this.#graph = graph;
    this.#opts = {
      blocked: () => false,
      blockedPath: () => false,
      heuristic: () => 0,
      distance: () => 1,
      compare: (a, b) => a.fScore - b.fScore,
      oriented: false,
      ...options,
    };
    this.#pool = new StatePool();
  }

  find(
    fromId: NodeId,
    toId: NodeId,
  ): typeof NO_PATH | Node<NodeData, LinkData, NodeId>[] {
    const from = this.#graph.getNode(fromId);
    if (!from) {
      throw new Error(`${fromId} is not defined in this graph`);
    }
    const to = this.#graph.getNode(toId);
    if (!to) {
      throw new Error(`${toId} is not defined in this graph`);
    }
    this.#pool.reset();

    // Maps nodeId to NodeSearchState.
    const nodeState = new Map<
      NodeId,
      NodeSearchState<NodeData, LinkData, NodeId>
    >();

    // the nodes that we still need to evaluate
    const openSet = new BinaryHeap(this.#opts.compare);

    const startNode = this.#pool.newState(from);
    nodeState.set(fromId, startNode);

    // For the first node, fScore is completely heuristic.
    startNode.fScore = this.#opts.heuristic(from, to);

    // The cost of going from start to start is zero.
    startNode.distanceToSource = 0;
    openSet.push(startNode);
    startNode.open = 1;

    let cameFrom: NodeSearchState<NodeData, LinkData, NodeId> | undefined =
      undefined;

    while (openSet.length > 0) {
      // console.log(openSet.toArray().map((o) => o.fScore));
      cameFrom = openSet.pop();
      if (!cameFrom) {
        throw new Error('Where we came from?');
      }

      if (goalReached(cameFrom, to)) {
        return reconstructPath(cameFrom);
      }

      // no need to visit this node anymore
      cameFrom.closed = true;
      for (
        const [otherNode, link] of this.#graph.linkedNodes(
          cameFrom.node.id,
          this.#opts.oriented,
        )
      ) {
        let otherSearchState = nodeState.get(otherNode.id);
        if (!otherSearchState) {
          otherSearchState = this.#pool.newState(otherNode);
          nodeState.set(otherNode.id, otherSearchState);
        }

        if (otherSearchState.closed) {
          // Already processed this node.
          continue;
        }
        if (this.#opts.blocked(otherNode, cameFrom.node, link)) {
          // Path is blocked. Ignore this route
          continue;
        }

        if (this.#opts.blockedPath(cameFrom, otherSearchState, link)) {
          // Search state path is blocked
          console.log(
            'blocked',
            cameFrom.parent?.node.id,
            '->',
            cameFrom.node.id,
            '->',
            otherSearchState.node.id,
          );
          continue;
        }

        // if (otherSearchState.open === 0) {
        //   // Remember this node.
        //   openSet.push(otherSearchState);
        //   otherSearchState.open = 1;
        // }

        const tentativeDistance = cameFrom.distanceToSource +
          this.#opts.distance(otherNode, cameFrom.node, link);
        if (tentativeDistance >= otherSearchState.distanceToSource) {
          // This would only make our path longer. Ignore this route.
          continue;
        }

        // bingo! we found shorter path:
        otherSearchState.parent = cameFrom;
        otherSearchState.distanceToSource = tentativeDistance;
        otherSearchState.fScore = tentativeDistance +
          this.#opts.heuristic(otherSearchState.node, to);

        // console.log(
        //   cameFrom.node.id,
        //   '->',
        //   otherSearchState.node.id,
        //   tentativeDistance,
        // );
        // What's needed is to re-heapify, starting with otherSearchState.
        // For now, just re-push this on, and it will end up farther up the
        // tree.  We may re-processes it later, but IIRC that's ok.
        // openSet.updateItem(otherSearchState.heapIndex);
        openSet.push(otherSearchState);
      }
    }

    // If we got here, then there is no path.
    return NO_PATH;
  }
}

// export function aStarPathSearch(graph, options) {
//   options = options || {};
//   // whether traversal should be considered over oriented graph.
//   var oriented = options.oriented;

//   var blocked = options.blocked;
//   if (!blocked) blocked = defaultSettings.blocked;

//   var heuristic = options.heuristic;
//   if (!heuristic) heuristic = defaultSettings.heuristic;

//   var distance = options.distance;
//   if (!distance) distance = defaultSettings.distance;
//   var pool = makeSearchStatePool();

//   return {
//     /**
//      * Finds a path between node `fromId` and `toId`.
//      * @returns {Array} of nodes between `toId` and `fromId`. Empty array is returned
//      * if no path is found.
//      */
//     find: find,
//   };

function goalReached<NodeData, LinkData, NodeId extends string | number>(
  searchState: NodeSearchState<NodeData, LinkData, NodeId>,
  targetNode: Node<NodeData, LinkData, NodeId>,
): boolean {
  return searchState.node === targetNode;
}

function reconstructPath<NodeData, LinkData, NodeId extends string | number>(
  searchState: NodeSearchState<NodeData, LinkData, NodeId>,
): Node<NodeData, LinkData, NodeId>[] {
  const path = [searchState.node];
  let parent = searchState.parent;

  while (parent) {
    path.push(parent.node);
    parent = parent.parent;
  }

  return path;
}
