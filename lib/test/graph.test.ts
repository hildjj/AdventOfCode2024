import { type Change, Graph, Link, Node } from '../graph.ts';
import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import { assertSpyCalls, spy } from '@std/testing/mock';

function dfs<NodeData, LinkData, NodeId extends string | number>(
  graph: Graph<NodeData, LinkData, NodeId>,
  startFromNodeId: NodeId,
  visitor: (node: Node<NodeData, LinkData, NodeId>) => boolean,
): void {
  const queue: NodeId[] = [startFromNodeId];
  while (queue.length) {
    const nodeId = queue.pop()!;
    for (const [_node, _link, otherNode] of graph.linkedNodes(nodeId, true)) {
      if (visitor(otherNode)) {
        queue.push(otherNode.id);
      } else {
        break;
      }
    }
  }
}

function hasCycles<NodeData, LinkData, NodeId extends string | number>(
  graph: Graph<NodeData, LinkData, NodeId>,
): boolean {
  let hasCycle = false;
  for (const node of graph.nodes()) {
    const visited = new Set();

    if (hasCycle || visited.has(node.id)) {
      break;
    }

    dfs(graph, node.id, (otherNode) => {
      if (visited.has(otherNode.id)) {
        hasCycle = true;
        return false;
      }

      visited.add(otherNode.id);
      return true;
    });
  }

  return hasCycle;
}

Deno.test('Graph', async (t) => {
  await t.step('construction', async (t) => {
    await t.step('add node adds node', () => {
      const graph = new Graph<string, undefined, number>();
      const customData = '31337';
      const node = graph.addNode(1, customData);

      assertEquals(graph.nodeCount, 1);
      assertEquals(graph.linkCount, 0);
      assertEquals(graph.getNode(1), node);
      assertEquals(node.data, customData);
      assertEquals(node.id, 1);
    });

    await t.step('hasNode checks node', () => {
      const graph = new Graph<number, number, number>();

      graph.addNode(1);

      assert(graph.getNode(1));
      assert(!graph.getNode(2));
    });

    await t.step('hasLink checks links', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      const link12 = graph.getLink(1, 2);
      assertEquals(link12?.fromId, 1);
      assertEquals(link12?.toId, 2);

      assert(graph.addLink(2, 3));

      // this is somewhat doubtful... has link will return null, but forEachLinkedNode
      // will actually iterate over this link. Not sure how to have consistency here
      // for now documenting behavior in the test:
      assert(!graph.getLink(2, 1));
      assert(!graph.getLink(1, null!));
      assert(!graph.getLink(null!, 2));
      assert(!graph.getLink(null!, null!));
    });

    await t.step('it fires update event when node is updated', () => {
      function checkChangedEvent(
        changes: Change<string, string, number>[],
      ): void {
        assertEquals(changes.length, 1);
        const [change] = changes;
        assert(change.type === 'node'); // ts doesn't understand assertEquals
        assertEquals(change.node.id, 1);
        assertEquals(change.node.data, 'world');
        assertEquals(change.changeType, 'update');
      }

      const graph = new Graph<string, string, number>();
      graph.addNode(1, 'hello');
      const mockCheck = spy(checkChangedEvent);
      graph.on('changed', mockCheck);
      graph.addNode(1, 'world');
      assertSpyCalls(mockCheck, 1);
    });

    // await t.step('it does async iteration over events', async () => {
    //   const graph = new Graph<string, string, number>();
    //   graph.addNode(1, 'hello');

    //   async function waitOne(): void {
    //     for await (const changes of graph.on('changed')) {
    //       assertEquals(changes.length, 1);
    //       const [change] = changes;
    //       assert(change.type === 'node');
    //       assertEquals(change.node.id, 1);
    //       assertEquals(change.node.data, 'world');
    //       assertEquals(change.changeType, 'update');
    //       return;
    //     }
    //   }
    //   const p = new Promise(async (resolve, reject) => {
    //   });
    //   graph.on('changed', mockCheck);
    //   graph.addNode(1, 'world');
    //   assertSpyCalls(mockCheck, 1);
    // });

    await t.step(
      'it can add node with id similar to reserved prototype property',
      () => {
        const graph = new Graph<string, string, string>();
        graph.addNode('constructor');
        graph.addLink('watch', 'constructor');

        let iterated = 0;
        for (const _ of graph.nodes()) {
          iterated += 1;
        }

        assert(graph.getLink('watch', 'constructor'));
        assertEquals(graph.linkCount, 1, 'one link');
        assertEquals(iterated, 2, 'has two nodes');
      },
    );

    await t.step('add link adds link', () => {
      const graph = new Graph<number, number, number>();

      const link = graph.addLink(1, 2);

      assertEquals(graph.nodeCount, 2, 'Two nodes');
      assertEquals(graph.linkCount, 1, 'One link');
      assertEquals(
        [...graph.getLinks(1)].length,
        1,
        'number of links of the first node is wrong',
      );
      assertEquals(
        [...graph.getLinks(2)].length,
        1,
        'number of links of the second node is wrong',
      );
      assertEquals(
        link,
        Array.from(graph.getLinks(1))[0],
        'invalid link in the first node',
      );
      assertEquals(
        link,
        Array.from(graph.getLinks(2))[0],
        'invalid link in the second node',
      );
    });

    await t.step('it can add multi-edges', () => {
      const graph = new Graph<number, string, number>({ multigraph: true });
      graph.addLink(1, 2, 'first');
      graph.addLink(1, 2, 'second');
      graph.addLink(1, 2, 'third');

      assertEquals(graph.linkCount, 3, 'three links!');
      assertEquals(graph.nodeCount, 2, 'Two nodes');

      for (const [_otherNode, link] of graph.linkedNodes(1)) {
        assert(
          link.data === 'first' ||
            link.data === 'second' ||
            link.data === 'third',
          'Link is here',
        );
      }
    });

    await t.step('it can produce unique link ids', async (t) => {
      // eslint-disable-next-line no-shadow
      await t.step('by default links are de-duped', () => {
        const seen: Record<string, number> = {};
        const graph = new Graph<number, string, number>();
        graph.addLink(1, 2, 'first');
        graph.addLink(1, 2, 'second');
        graph.addLink(1, 2, 'third');

        for (const link of graph.links()) {
          seen[link.id] = (seen[link.id] || 0) + 1;
        }

        const link = graph.getLink(1, 2);
        assert(link);
        assertEquals(seen[link.id], 1, 'Link 1->2 seen 1 time');
        assertEquals(link.data, 'third', 'Last link wins');
      });

      await t.step('You can create multigraph', () => {
        const graph = new Graph<number, string, number>({
          multigraph: true,
        });

        const seen = new Set<string>();
        graph.addLink(1, 2, 'first');
        graph.addLink(1, 2, 'second');
        graph.addLink(1, 2, 'third');
        for (const link of graph.links()) {
          assert(!seen.has(link.id), link.id + ' is unique');
          seen.add(link.id);
        }

        assertEquals(graph.linkCount, 3, 'All three links are here');
      });
    });

    await t.step('add one node fires changed event', () => {
      const graph = new Graph<number, number, string>();
      const testNodeId = 'hello world';

      function changeEvent(changes: Change<number, number, string>[]): void {
        assert(changes?.length === 1, 'Only one change should be recorded');
        assertEquals(changes[0].type, 'node');
        if (changes[0].type === 'node') {
          assertEquals(
            changes[0].node.id,
            testNodeId,
            'Wrong node change notification',
          );
        }
        assertEquals(changes[0].changeType, 'add', 'Add change type expected.');
      }
      const changeEventSpy = spy(changeEvent);

      graph.on('changed', changeEventSpy);

      graph.addNode(testNodeId);
      assertSpyCalls(changeEventSpy, 1);
    });

    await t.step('add link fires changed event', () => {
      const graph = new Graph<number, number, number>();
      const fromId = 1;
      const toId = 2;

      function changeEvent(changes: Change<number, number, number>[]): void {
        assert(
          changes?.length === 3,
          'Three change should be recorded: node, node and link',
        );
        assertEquals(changes[2].type, 'link');
        if (changes[2].type === 'link') {
          assertEquals(changes[2].link.fromId, fromId, 'Wrong link from Id');
          assertEquals(changes[2].link.toId, toId, 'Wrong link toId');
          assertEquals(
            changes[2].changeType,
            'add',
            'Add change type expected.',
          );
        }
      }

      const changeEventSpy = spy(changeEvent);
      graph.on('changed', changeEventSpy);

      graph.addLink(fromId, toId);
      assertSpyCalls(changeEventSpy, 1);
    });

    await t.step('remove isolated node remove it', () => {
      const graph = new Graph<number, number, number>();

      graph.addNode(1);
      graph.removeNode(1);

      assertEquals(graph.nodeCount, 0, 'Remove operation failed');
    });

    await t.step('supports plural methods', () => {
      const graph = new Graph<number, number, number>();

      graph.addLink(1, 2);

      assertEquals(graph.nodeCount, 2, 'two nodes are there');
      assertEquals(graph.linkCount, 1, 'two nodes are there');
    });

    await t.step('remove link removes it', () => {
      const graph = new Graph<number, number, number>();
      const link = graph.addLink(1, 2);

      const linkIsRemoved = graph.removeLink(link);
      assert(linkIsRemoved, 'Link removal is successful');

      assertEquals(graph.nodeCount, 2, 'remove link should not remove nodes');
      assertEquals(graph.linkCount, 0, 'No Links');
      assertEquals(
        [...graph.getLinks(1)].length,
        0,
        'link should be removed from the first node',
      );
      assertEquals(
        [...graph.getLinks(2)].length,
        0,
        'link should be removed from the second node',
      );

      for (const _link of graph.links()) {
        assert(false, 'No links should be in graph');
      }
    });

    await t.step('it can remove link by from/to ids', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);

      const linkIsRemoved = graph.removeLink(1, 2);
      assert(linkIsRemoved, 'Link removal is successful');

      assertEquals(graph.nodeCount, 2, 'remove link should not remove nodes');
      assertEquals(graph.linkCount, 0, 'No Links');
      assertEquals(
        [...graph.getLinks(1)].length,
        0,
        'link should be removed from the first node',
      );
      assertEquals(
        [...graph.getLinks(2)].length,
        0,
        'link should be removed from the second node',
      );

      for (const _link of graph.links()) {
        assert(false, 'No links should be in graph');
      }
    });

    await t.step('remove link returns false if no link removed', () => {
      const graph = new Graph<number, number, number>();

      graph.addLink(1, 2);
      assertThrows(() => graph.removeLink(3, undefined!));
      assertThrows(() => graph.removeLink(undefined!));
    });

    await t.step('remove isolated node fires changed event', () => {
      const graph = new Graph<number, number, number>();
      graph.addNode(1);

      function changeEvent(changes: Change<number, number, number>[]): void {
        assert(
          changes?.length === 1,
          'One change should be recorded: node removed',
        );
        assertEquals(changes[0].type, 'node');
        if (changes[0].type === 'node') {
          assertEquals(changes[0].node.id, 1, 'Wrong node Id');
          assertEquals(
            changes[0].changeType,
            'remove',
            "'remove' change type expected.",
          );
        }
      }
      const changeEventSpy = spy(changeEvent);
      graph.on('changed', changeEventSpy);

      const result = graph.removeNode(1);
      assert(result, 'node is removed');
      assertSpyCalls(changeEventSpy, 1);
    });

    await t.step('remove link fires changed event', () => {
      const graph = new Graph<number, number, number>();
      const link = graph.addLink(1, 2);

      function changeEvent(changes: Change<number, number, number>[]): void {
        assert(
          changes?.length === 1,
          'One change should be recorded: link removed',
        );
        assertEquals(changes[0].type, 'link');
        if (changes[0].type === 'link') {
          assertEquals(changes[0].link, link, 'Wrong link removed');
          assertEquals(
            changes[0].changeType,
            'remove',
            "'remove' change type expected.",
          );
        }
      }
      const changeEventSpy = spy(changeEvent);
      graph.on('changed', changeEventSpy);

      graph.removeLink(link);
      assertSpyCalls(changeEventSpy, 1);
    });

    await t.step('remove linked node fires changed event', () => {
      const graph = new Graph<number, number, number>();
      const link = graph.addLink(1, 2);
      const nodeIdToRemove = 1;

      function changeEvent(changes: Change<number, number, number>[]): void {
        assert(
          changes && changes.length === 2,
          'Two changes should be recorded: link and node removed',
        );
        assertEquals(changes[0].type, 'link');
        if (changes[0].type === 'link') {
          assertEquals(changes[0].link, link, 'Wrong link removed');
          assertEquals(
            changes[0].changeType,
            'remove',
            "'remove' change type expected.",
          );
        }
        assertEquals(changes[1].type, 'node');
        if (changes[1].type === 'node') {
          assertEquals(
            changes[1].node.id,
            nodeIdToRemove,
            'Wrong node removed',
          );
          assertEquals(
            changes[1].changeType,
            'remove',
            "'remove' change type expected.",
          );
        }
      }
      const changeEventSpy = spy(changeEvent);
      graph.on('changed', changeEventSpy);

      graph.removeNode(nodeIdToRemove);
      assertSpyCalls(changeEventSpy, 1);
    });

    await t.step('remove node with many links removes them all', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      graph.addLink(1, 3);

      graph.removeNode(1);

      assertEquals(
        graph.nodeCount,
        2,
        'remove link should remove one node only',
      );
      assertEquals(
        [...graph.getLinks(1)].length,
        0,
        'link should be removed from the first node',
      );
      assertEquals(
        [...graph.getLinks(2)].length,
        0,
        'link should be removed from the second node',
      );
      assertEquals(
        [...graph.getLinks(3)].length,
        0,
        'link should be removed from the third node',
      );
      for (const _link of graph.links()) {
        assert(false, 'No links should be in graph');
      }
    });

    await t.step('remove node returns false when no node removed', () => {
      const graph = new Graph<number, number, string>();
      graph.addNode('hello');
      const result = graph.removeNode('blah');
      assertFalse(result, 'No "blah" node');
    });

    await t.step('clearGraph clears graph', () => {
      const graph = new Graph<number, number, number>();
      /** @ts-ignore */
      graph.addNode('hello');
      graph.addLink(1, 2);
      graph.clear();

      assertEquals(graph.nodeCount, 0, 'No nodes');
      assertEquals(graph.nodeCount, 0, 'No links');
    });

    // await t.step('beginUpdate holds events', () => {
    //   const graph = new Graph<number, number, number>();
    //   let changedCount = 0;
    //   graph.on('changed', () => {
    //     changedCount += 1;
    //   });
    //   graph.beginUpdate();
    //   graph.addNode(1);
    //   assertEquals(
    //     changedCount,
    //     0,
    //     'Begin update freezes updates until `endUpdate()`',
    //   );
    //   graph.endUpdate();
    //   assertEquals(changedCount, 1, 'event is fired only after endUpdate()');
    // });
  });

  await t.step('hasCycles', async (t) => {
    await t.step('can detect cycles loops', () => {
      // our graph has three components
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      graph.addLink(2, 3);

      graph.addLink(5, 6);
      graph.addNode(8);
      // let's add loop:
      graph.addLink(9, 9);

      // lets verify it:
      assert(hasCycles(graph), 'cycle found');
    });

    await t.step('can detect simple cycles', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      graph.addLink(2, 3);
      graph.addLink(3, 6);
      graph.addLink(6, 1);

      // lets verify it:
      assert(hasCycles(graph), 'cycle found');
    });

    await t.step('can detect when no cycles', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      graph.addLink(2, 3);
      graph.addLink(3, 6);

      assertFalse(hasCycles(graph), 'cycle should not be found');
    });
  });

  await t.step('iteration', async (t) => {
    await t.step('forEachLinkedNode respects orientation', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      graph.addLink(2, 3);
      const oriented = true;
      for (const [_node, link] of graph.linkedNodes(2, oriented)) {
        assertEquals(
          link.toId,
          3,
          'Only 3 is connected to node 2, when traversal is oriented',
        );
      }
      for (const [_node, link] of graph.linkedNodes(2, !oriented)) {
        assert(
          link.toId === 3 || link.toId === 2,
          'both incoming and outgoing links are visited',
        );
      }
    });

    await t.step('forEachLinkedNode handles self-loops', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 1);
      // we should visit exactly one time
      for (const [_node, link] of graph.linkedNodes(1)) {
        assert(link.fromId === 1 && link.toId === 1, 'Link 1 is visited once');
      }
    });

    await t.step('forEachLinkedNode will not crash on invalid node id', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      for (const _ of graph.linkedNodes(3)) {
        assert(false, 'Should never be executed');
      }
    });

    await t.step('forEachLinkedNode can quit fast for oriented graphs', () => {
      const graph = new Graph<number, number, number>();
      const oriented = true;
      graph.addLink(1, 2);
      graph.addLink(1, 3);

      let visited = 0;
      for (const _ of graph.linkedNodes(1, oriented)) {
        visited += 1;
        break;
      }
      assertEquals(visited, 1, 'One link is visited');
    });

    await t.step(
      'forEachLinkedNode can quit fast for non-oriented graphs',
      () => {
        const graph = new Graph<number, number, number>();
        const oriented = false;
        graph.addLink(1, 2);
        graph.addLink(1, 3);

        let visited = 0;
        for (const _ of graph.linkedNodes(1, oriented)) {
          visited += 1;
          break;
        }
        assertEquals(visited, 1, 'One link is visited');
      },
    );

    await t.step('forEachLink visits each link', () => {
      const graph = new Graph<number, number, number>();
      graph.addLink(1, 2);
      for (const link of graph.links()) {
        assertEquals(link.fromId, 1);
        assertEquals(link.toId, 2);
      }
    });
  });

  await t.step('Link', () => {
    const link = new Link<number, number>(1, 2);
    assert(link);

    const graph = new Graph<number, number, number>();
    assertFalse(graph.removeLinkInstance(undefined!));
    assertFalse(graph.removeLinkInstance(link));
  });
});
