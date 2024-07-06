/* eslint-disable no-restricted-syntax */
const time = {
  a: 12,
  b: 2,
  c: 1,
  d: 4,
};

// Start with today's date
let currentDate = new Date('2024-08-14');
console.log(`Today's date: ${currentDate.toDateString()}`);

// Function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Object to store the end dates
const endDates = {};

for (const key in time) {
  currentDate = addDays(currentDate, time[key]);
  endDates[key] = currentDate.toDateString();
}

// Output the end dates
console.log(endDates);
