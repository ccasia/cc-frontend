const test = [
  {
    name: 'Afiq',
  },
  {
    name: 'daial',
    age: 21,
  },
];

const a = test.find((item) => item.name === 'Afiq').name;

console.log(a);
