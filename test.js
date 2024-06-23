function textToVector(text, vocabulary) {
  const words = text.split(/\W+/);
  console.log('Splitting words', words);
  const vector = new Array(vocabulary.length).fill(0);

  words.forEach((word) => {
    const index = vocabulary.indexOf(word);
    console.log(index);
    if (index !== -1) {
      vector[index] += 1;
    }
  });

  return vector;
}

const vocabulary = ['hello', 'world', 'example', 'text'];
const text = 'Hello, world! This is an example text.';
const vector = textToVector(text.toLowerCase(), vocabulary);
console.log(vector);
