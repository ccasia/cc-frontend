// const data = [
//   {
//     module: 'creator',
//     permission: 'read',
//   },
//   [
//     {
//       module: 'creator',
//       permission: 'update',
//     },
//   ],
// ];

// const flattenedData = data.flat(); // Flatten the nested array
// console.log(flattenedData);
// const reducedData = flattenedData.reduce((acc, item) => {
//   if (!acc[item.module]) {
//     acc[item.module] = { module: item.module, permissions: [] };
//   }
//   acc[item.module].permissions.push(item.permission);
//   return acc;
// }, {});

// const result = Object.values(reducedData);
// console.log(result);

const test = 'DAwdad';

console.log(test.includes('D'));
