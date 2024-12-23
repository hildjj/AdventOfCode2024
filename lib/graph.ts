/**
 * @example
 *  import {Graph} from './graph.ts';
 *  graph.addNode(1);     // graph has one node.
 *  graph.addLink(2, 3);  // now graph contains three nodes and one link.
 */
import { EventEmitter } from '$event';

export interface GraphOptions {
  multigraph?: boolean;
}

type ChangeType = 'add' | 'update' | 'remove';

interface NodeChange<
  NodeData,
  LinkData,
  NodeId extends string | number = string,
> {
  type: 'node';
  changeType: ChangeType;
  node: Node<NodeData, LinkData, NodeId>;
}

interface LinkChange<LinkData, NodeId extends string | number = string> {
  type: 'link';
  changeType: ChangeType;
  link: Link<LinkData, NodeId>;
}

export type Change<
  NodeData,
  LinkData,
  NodeId extends string | number = string,
> =
  | NodeChange<NodeData, LinkData, NodeId>
  | LinkChange<LinkData, NodeId>;

type Events<NodeData, LinkData, NodeId extends string | number = string> = {
  changed: [Change<NodeData, LinkData, NodeId>[]];
};

export class Node<NodeData, LinkData, NodeId extends string | number = string> {
  id: NodeId;
  links: Set<Link<LinkData, NodeId>> | undefined = undefined;
  data: NodeData | undefined;

  constructor(id: NodeId, data?: NodeData) {
    this.id = id;
    this.data = data;
  }

  addLink(link: Link<LinkData, NodeId>): void {
    if (this.links) {
      this.links.add(link);
    } else {
      this.links = new Set([link]);
    }
  }
}

export class Link<LinkData, NodeId extends string | number = string> {
  fromId: NodeId;
  toId: NodeId;
  data: LinkData | undefined;
  id: string;

  constructor(fromId: NodeId, toId: NodeId, data?: LinkData, id?: string) {
    this.fromId = fromId;
    this.toId = toId;
    this.data = data;
    this.id = id ?? Link.makeId(fromId, toId);
  }

  otherId(id: NodeId): NodeId {
    if (this.fromId === id) {
      return this.toId;
    }
    return this.fromId;
  }

  static makeId<NodeId extends string | number = string>(
    fromId: NodeId,
    toId: NodeId,
  ): string {
    return `${fromId}👉${toId}`;
  }
}

type LinkedNodes<NodeData, LinkData, NodeId extends string | number = string> =
  [
    from: Node<NodeData, LinkData, NodeId>,
    link: Link<LinkData, NodeId>,
    to: Node<NodeData, LinkData, NodeId>,
  ];

export class Graph<NodeData, LinkData, NodeId extends string | number = string>
  extends EventEmitter<Events<NodeData, LinkData, NodeId>> {
  #opts: Required<GraphOptions>;
  #nodes = new Map<NodeId, Node<NodeData, LinkData, NodeId>>();
  #links = new Map<string, Link<LinkData, NodeId>>();
  #multiEdges: Record<string, number> = {};
  #suspendEvents = 0;
  #listening = false;
  #changes: Change<NodeData, LinkData, NodeId>[] = [];

  constructor(options = {}) {
    super();
    this.#opts = {
      multigraph: false,
      ...options,
    };
  }

  #enterModification(): void {
    this.#suspendEvents += 1;
  }

  #exitModification(): void {
    this.#suspendEvents -= 1;
    if (this.#suspendEvents === 0 && this.#changes.length > 0) {
      this.emit('changed', this.#changes);
      this.#changes.length = 0;
    }
  }

  #recordNodeChange(
    node: Node<NodeData, LinkData, NodeId>,
    changeType: ChangeType,
  ): void {
    if (this.#listening) {
      this.#changes.push({
        type: 'node',
        changeType,
        node,
      });
    }
  }

  #recordLinkChange(
    link: Link<LinkData, NodeId>,
    changeType: ChangeType,
  ): void {
    if (this.#listening) {
      this.#changes.push({
        type: 'link',
        changeType,
        link,
      });
    }
  }

  get nodeCount(): number {
    return this.#nodes.size;
  }

  get linkCount(): number {
    return this.#links.size;
  }

  getNode(nodeId: NodeId): Node<NodeData, LinkData, NodeId> | undefined {
    return this.#nodes.get(nodeId);
  }

  addNode(nodeId: NodeId, data?: NodeData): Node<NodeData, LinkData, NodeId> {
    this.#enterModification();

    let node = this.getNode(nodeId);
    if (node) {
      node.data = data;
      this.#recordNodeChange(node, 'update');
    } else {
      node = new Node<NodeData, LinkData, NodeId>(nodeId, data);
      this.#recordNodeChange(node, 'add');
      this.#nodes.set(nodeId, node);
    }

    this.#exitModification();
    return node;
  }

  removeNode(nodeId: NodeId): boolean {
    const node = this.getNode(nodeId);
    if (!node) {
      return false;
    }

    this.#enterModification();

    const prevLinks = node.links;
    if (prevLinks) {
      prevLinks.forEach((l) => this.removeLinkInstance(l));
      node.links = undefined;
    }

    this.#nodes.delete(nodeId);
    this.#recordNodeChange(node, 'remove');
    this.#exitModification();

    return true;
  }

  removeLinkInstance(link: Link<LinkData, NodeId>): boolean {
    if (!link || !this.#links.get(link.id)) {
      return false;
    }

    this.#enterModification();

    this.#links.delete(link.id);

    this.getNode(link.fromId)?.links?.delete(link);
    this.getNode(link.toId)?.links?.delete(link);

    this.#recordLinkChange(link, 'remove');
    this.#exitModification();

    return true;
  }

  addLink(
    fromId: NodeId,
    toId: NodeId,
    data?: LinkData,
  ): Link<LinkData, NodeId> {
    this.#enterModification();

    const fromNode = this.getNode(fromId) ?? this.addNode(fromId);
    const toNode = this.getNode(toId) ?? this.addNode(toId);

    const link = this.createLink(fromId, toId, data);
    const isUpdate = this.#links.has(link.id);
    this.#links.set(link.id, link);

    // TODO(upstream): this is not cool. On large graphs potentially would
    // consume more memory.

    // TODO(hildjj) Urgent: links are in set, not IDs
    fromNode.addLink(link);
    if (fromId !== toId) {
      // make sure we are not duplicating links for self-loops
      toNode.addLink(link);
    }

    this.#recordLinkChange(link, isUpdate ? 'update' : 'add');
    this.#exitModification();
    return link;
  }

  #createSingleLink(
    fromId: NodeId,
    toId: NodeId,
    data?: LinkData,
  ): Link<LinkData, NodeId> {
    const linkId = Link.makeId(fromId, toId);
    const prevLink = this.#links.get(linkId);
    if (prevLink) {
      prevLink.data = data;
      return prevLink;
    }

    return new Link(fromId, toId, data, linkId);
  }

  #createUniqueLink(
    fromId: NodeId,
    toId: NodeId,
    data?: LinkData,
  ): Link<LinkData, NodeId> {
    // TODO(upstream): Find a better/faster way to store multigraphs
    let linkId = Link.makeId(fromId, toId);
    const isMultiEdge = Object.hasOwn(this.#multiEdges, linkId);
    if (isMultiEdge || this.getLink(fromId, toId)) {
      if (!isMultiEdge) {
        this.#multiEdges[linkId] = 0;
      }
      const suffix = '@' + (++this.#multiEdges[linkId]);
      linkId = Link.makeId(fromId + suffix, toId + suffix);
    }

    return new Link(fromId, toId, data, linkId);
  }

  getLink(
    fromNodeId: NodeId,
    toNodeId: NodeId,
  ): Link<LinkData, NodeId> | undefined {
    if (!fromNodeId || !toNodeId) {
      return undefined;
    }
    return this.#links.get(Link.makeId(fromNodeId, toNodeId));
  }

  *getLinks(
    nodeId: NodeId,
  ): Generator<Link<LinkData, NodeId>, undefined, undefined> {
    const vals = this.getNode(nodeId)?.links?.values();
    if (vals) {
      yield* vals;
    }
  }

  removeLink(link: Link<LinkData, NodeId>): boolean;
  removeLink(fromNodeId: NodeId, toNodeId: NodeId): boolean;
  removeLink(
    fromNodeIdOrLink: NodeId | Link<LinkData, NodeId>,
    toNodeId?: NodeId,
  ): boolean {
    const link = (fromNodeIdOrLink instanceof Link)
      ? fromNodeIdOrLink
      : this.getLink(fromNodeIdOrLink, toNodeId!);
    if (!link) {
      throw new Error('Unknown link');
    }
    return this.removeLinkInstance(link);
  }

  override on<K extends 'changed'>(
    eventName: K,
    listener: (...args: Events<NodeData, LinkData, NodeId>[K]) => void,
  ): this;
  override on<K extends 'changed'>(
    eventName: K,
  ): AsyncIterableIterator<Events<NodeData, LinkData, NodeId>[K]>;
  override on<K extends keyof Events<NodeData, LinkData, NodeId>>(
    eventName: K,
    listener?:
      | ((...args: Events<NodeData, LinkData, NodeId>[K]) => void)
      | undefined,
  ): this | AsyncIterableIterator<Events<NodeData, LinkData, NodeId>[K]> {
    this.#listening = true;
    if (listener) {
      return super.on(eventName, listener);
    }
    return super.on(eventName);
  }

  *nodes(): Generator<Node<NodeData, LinkData, NodeId>, undefined, undefined> {
    yield* this.#nodes.values();
  }

  *links(): Generator<Link<LinkData, NodeId>, undefined, undefined> {
    yield* this.#links.values();
  }

  *linkedNodes(
    nodeId: NodeId | Node<NodeData, LinkData, NodeId>,
    oriented = false,
  ): Generator<LinkedNodes<NodeData, LinkData, NodeId>, undefined, undefined> {
    const node = (nodeId instanceof Node) ? nodeId : this.getNode(nodeId);
    if (node?.links) {
      if (oriented) {
        yield* this.#orientedLinks(node);
      } else {
        yield* this.#nonOrientedLinks(node);
      }
    }
  }

  *#nonOrientedLinks(
    node: Node<NodeData, LinkData, NodeId>,
  ): Generator<LinkedNodes<NodeData, LinkData, NodeId>, undefined, undefined> {
    for (const link of node.links!.values()) {
      const linkedNodeId = link.fromId === node.id ? link.toId : link.fromId;
      const otherNode = this.getNode(linkedNodeId);
      if (!otherNode) {
        throw new Error('Invalid link');
      }
      yield [node, link, otherNode];
    }
  }

  *#orientedLinks(
    node: Node<NodeData, LinkData, NodeId>,
  ): Generator<LinkedNodes<NodeData, LinkData, NodeId>, undefined, undefined> {
    for (const link of node.links!.values()) {
      if (link.fromId === node.id) {
        const otherNode = this.getNode(link.toId);
        if (!otherNode) {
          throw new Error('Invalid node state');
        }
        yield [node, link, otherNode];
      }
    }
  }

  clear(): void {
    this.#enterModification();
    for (const node of this.nodes()) {
      this.removeNode(node.id);
    }
    this.#exitModification();
  }

  createLink(
    fromId: NodeId,
    toId: NodeId,
    data?: LinkData,
  ): Link<LinkData, NodeId> {
    return this.#opts.multigraph
      ? this.#createUniqueLink(fromId, toId, data)
      : this.#createSingleLink(fromId, toId, data);
  }
}
