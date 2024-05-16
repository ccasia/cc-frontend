// /* eslint-disable react/prop-types */
// /* eslint-disable array-callback-return */
// import dayjs from 'dayjs';
// import duration from 'dayjs/plugin/duration';
// import React, { useState, useEffect } from 'react';
// import localizedFormat from 'dayjs/plugin/localizedFormat';

// import { Box, Grid, Stack, Button, Container, Typography } from '@mui/material';

// dayjs.extend(localizedFormat);
// dayjs.extend(duration);

// const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// export const Calendar = () => {
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [event, setEvent] = useState([]);
//   const [toggleModal, setToggleModal] = useState(false);

//   const getFirstDay = currentDate.startOf('month').day();
//   const currentDay = currentDate.date();
//   const lastDayOfTheMonth = currentDate.endOf('month').date();
//   const eachDayInAMonth = Array.from({ length: lastDayOfTheMonth }, (_, index) => index + 1);

//   const handleNextMonth = () => {
//     setCurrentDate(currentDate.add(1, 'month'));
//   };

//   const handlePrevMonth = () => {
//     setCurrentDate(currentDate.subtract(1, 'month'));
//   };

//   useEffect(() => {
//     console.log(dayjs(event[0]?.date).isSame(dayjs().date(2), 'date'));
//   }, [currentDate, event]);

//   //   useEffect(() => {
//   //     console.log(event);
//   //   }, [event]);

//   return (
//     <Container
//       sx={{
//         textAlign: 'center',
//       }}
//     >
//       <Stack direction="row" justifyContent="space-evenly">
//         <Button onClick={handlePrevMonth}>Prev</Button>
//         <Typography variant="h1">{currentDate.format('MMMM YYYY')}</Typography>
//         <Button onClick={handleNextMonth}>Next</Button>
//       </Stack>
//       <Grid container columns={7} spacing={2} my={5} m={0} p={0}>
//         {WEEKDAYS.map((day) => (
//           <Grid item xs={1}>
//             <Typography variant="h3">{day}</Typography>
//           </Grid>
//         ))}
//         {Array(getFirstDay)
//           .fill()
//           .map(() => (
//             <Grid item xs={1} />
//           ))}
//         {eachDayInAMonth.map((date, i) => (
//           <Grid item xs={1} key={i}>
//             <Box
//               sx={{
//                 border: '2px solid black',
//                 borderRadius: 1,
//                 p: 5,
//                 bgcolor: (theme) =>
//                   (event.some((elem) => dayjs(elem.date).isSame(currentDate.date(date), 'date')) &&
//                     theme.palette.info.main) ||
//                   (currentDate.isSame(dayjs().date(date), 'date') && theme.palette.primary.main),
//                 //   (event.filter((elem) =>
//                 //     dayjs(elem.date).isSame(currentDate.date(date), 'date')
//                 //   ) &&
//                 //     theme.palette.info.main),

//                 cursor: 'pointer',
//               }}
//               component="div"
//               position="relative"
//               //   onMouseEnter={() => {
//               //     if (event.map((elem) => dayjs(elem.date).date()).includes(date)) {
//               //       setToggleModal(true);
//               //     } else {
//               //       setToggleModal(false);
//               //     }
//               //   }}
//               //   onMouseLeave={() => setToggleModal(false)}
//               onClick={() => {
//                 const title = prompt('Event ?');
//                 setEvent((prev) => [
//                   ...prev,
//                   {
//                     title,
//                     date: dayjs().date(date).format(),
//                   },
//                 ]);
//               }}
//             >
//               <Typography variant="h6">{date}</Typography>
//               {event
//                 .filter((elem) => dayjs(elem.date).isSame(currentDate.date(date), 'date'))
//                 .map((elem) => (
//                   <Typography variant="caption">{elem?.title}</Typography>
//                 ))}
//               {/* {event
//                 .filter((elem) => dayjs(elem.date).date().isSame(dayjs().date(date)))
//                 .map((elem) => {
//                   <Typography>{elem?.title}</Typography>;
//                 })} */}
//               {/* {toggleModal && (
//                 <ModalHover
//                   event={event.filter((elem) => dayjs(elem.date).date() === date)}
//                   date={date}
//                 />
//               )} */}
//             </Box>
//           </Grid>
//         ))}
//       </Grid>
//     </Container>
//   );
// };

// // const ModalHover = ({ event, date }) =>
// //   dayjs(event.date).date() === date && (
// //     <Box>
// //       <Typography>{event.title}</Typography>;
// //     </Box>
// //   );
