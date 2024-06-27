const makeArr = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('Successfully upload!');
    }, 2000);
  });

const test = async () => {
  const a = await makeArr();
  console.log(a);
};

test();
