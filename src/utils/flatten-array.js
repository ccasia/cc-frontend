// ----------------------------------------------------------------------

export function flattenArray(list, key = 'children') {
  let children = [];

  const flatten = list?.map((item) => {
    if (item[key] && item[key].length) {
      children = [...children, ...item[key]];
    }
    return item;
  });

  return flatten?.concat(children.length ? flattenArray(children, key) : children);
}

export const flattenData = (array, key) => {
  const flattenedData = array?.flat();
  const ha = flattenedData?.reduce((acc, item) => {
    if (!acc[item.module.name]) {
      acc[item.module.name] = { module: item.module.name, permissions: [] };
    }
    acc[item.module.name].permissions.push(item.permission.name);
    return acc;
  }, []);

  return ha;
};
