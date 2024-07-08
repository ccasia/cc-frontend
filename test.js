const a = { name: 'Afiq' };

const c = { ...a, ...{ campaign: 'Dsads' } };

const convert = JSON.stringify(c);

console.log(convert);
