const arr1 = ['Test', 'Danial', 'Afiq']; // updated
const arr2 = ['Danial', 'Afiq']; // current

const a = arr1.every((item) => arr2.includes(item));

console.log(a);
