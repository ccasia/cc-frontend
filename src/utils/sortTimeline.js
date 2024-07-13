// export const sortTimelines = (timelines) => {
//   const sorted = [];
//   const visited = new Set();
//   const map = new Map();

//   console.log(timelines);

//   // Create a map for quick access to timelines by id
//   timelines.forEach((t) => map.set(t.id, t));

//   const visit = (timeline) => {
//     if (visited.has(timeline.id)) return;
//     visited.add(timeline.id);

//     timeline.dependencies.forEach((dep) => {
//       visit(map.get(dep.dependsOnTimelineId));
//     });

//     sorted.push(timeline);
//   };

//   timelines.forEach((timeline) => visit(timeline));

//   return sorted;
// };

export const topologicalSort = (timelines) => {
  // Initialize the graph and in-degrees map
  const graph = new Map();
  const inDegrees = new Map();
  const idToTimeline = new Map();

  // Populate the graph, in-degrees map, and idToTimeline map
  timelines.forEach((timeline) => {
    const { id, dependsOn } = timeline;
    if (!graph.has(id)) graph.set(id, []);
    if (!inDegrees.has(id)) inDegrees.set(id, 0);
    idToTimeline.set(id, timeline);

    dependsOn.forEach((dep) => {
      const depId = dep.dependsOnTimelineId;
      if (!graph.has(depId)) graph.set(depId, []);
      if (!inDegrees.has(depId)) inDegrees.set(depId, 0);

      graph.get(depId).push(id);
      inDegrees.set(id, inDegrees.get(id) + 1);
    });
  });

  // Initialize the queue with nodes having in-degree of 0
  const queue = [];
  inDegrees.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  const result = [];

  // Process the queue
  while (queue.length > 0) {
    const current = queue.shift();
    result.push(idToTimeline.get(current));

    graph.get(current).forEach((neighbor) => {
      inDegrees.set(neighbor, inDegrees.get(neighbor) - 1);
      if (inDegrees.get(neighbor) === 0) queue.push(neighbor);
    });
  }

  // Check for cycles in the graph
  if (result.length !== timelines.length) {
    throw new Error('Graph has a cycle!');
  }

  return result;
};
