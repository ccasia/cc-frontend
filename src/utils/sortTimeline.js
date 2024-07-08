export const sortTimelines = (timelines) => {
  const sorted = [];
  const visited = new Set();
  const map = new Map();

  // Create a map for quick access to timelines by id
  timelines.forEach((t) => map.set(t.id, t));

  const visit = (timeline) => {
    if (visited.has(timeline.id)) return;
    visited.add(timeline.id);

    timeline.dependencies.forEach((dep) => {
      visit(map.get(dep.dependsOnTimelineId));
    });

    sorted.push(timeline);
  };

  timelines.forEach((timeline) => visit(timeline));

  return sorted;
};
