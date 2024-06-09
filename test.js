// const navigations = [
//   {
//     roles: ['admin'],
//     items: [
//       {
//         title: 'Campaign',
//         children: [
//           {
//             title: 'Discover Campaign',
//             // icon: <Iconify icon="material-symbols:explore-outline" />,
//           },
//           {
//             title: 'Create Campaign',
//             // icon: <Iconify icon="gridicons:create" />,
//           },
//           {
//             title: 'Manage Campaign',
//             // icon: <Iconify icon="mingcute:settings-3-fill" />,
//           },
//           {
//             roles: ['BDD'],
//             title: 'Settings',
//             // icon: <Iconify icon="mingcute:settings-3-fill" />,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     roles: ['admin'],
//     items: [
//       {
//         title: 'Brand',
//         children: [
//           {
//             title: 'Create Brands',
//           },
//         ],
//       },
//     ],
//   },
// ];

// const role = 'admin';
// const subroles = 'BD';

// const a = navigations
//   .filter((nav) => nav.roles.some((r) => ['admin'].includes(r)))
//   .map((nav) => ({
//     ...nav,
//     items: nav.items.map((item) => ({
//       ...item,
//       children: item.children
//         ? item.children.filter(
//             (child) => !child.roles || child.roles.some((r) => ['a'].includes(r))
//           )
//         : item.children,
//     })),
//   }));

// console.log(JSON.stringify(a, null, 2));

const company = {
  Error: 'ADWADwa',
};

console.log(Object.values(company)[0].includes('A'));
