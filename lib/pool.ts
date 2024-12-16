import { type Node } from './graph.ts';

/**
 * This class represents a single search node in the exploration tree for
 * A* algorithm.
 */
export class NodeSearchState<
  NodeData,
  LinkData,
  NodeId extends string | number = string,
> {
  node: Node<NodeData, LinkData, NodeId>;
  parent: NodeSearchState<NodeData, LinkData, NodeId> | null = null;
  closed = false;
  open = 0;
  distanceToSource = Infinity;
  fScore = Infinity;
  heapIndex = -1;

  constructor(node: Node<NodeData, LinkData, NodeId>) {
    this.node = node;
  }
}

export class StatePool<
  NodeData,
  LinkData,
  NodeId extends string | number = string,
> {
  #currentInCache = 0;
  #nodeCache: NodeSearchState<
    NodeData,
    LinkData,
    NodeId
  >[] = [];

  reset(): void {
    this.#currentInCache = 0;
  }

  newState(
    node: Node<NodeData, LinkData, NodeId>,
  ): NodeSearchState<NodeData, LinkData, NodeId> {
    let cached = this.#nodeCache[this.#currentInCache];
    if (cached) {
      cached.node = node;
      // How we came to this node?
      cached.parent = null;

      cached.closed = false;
      cached.open = 0;

      cached.distanceToSource = Infinity;
      // the f(n) = g(n) + h(n) value
      cached.fScore = Infinity;

      // used to reconstruct heap when fScore is updated.
      cached.heapIndex = -1;
    } else {
      cached = new NodeSearchState(node);
      this.#nodeCache[this.#currentInCache] = cached;
    }
    this.#currentInCache++;
    return cached;
  }
}
