const test = [
  {
    name: 'ASD',
    id: 2,
  },
  {
    name: 'sasdad',
    id: 3,
  },
  {
    name: 'asdas',
    id: 2,
  },
];

test.forEach((item, index) => {
  console.log(test[index + 1]);
});
