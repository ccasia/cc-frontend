import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import axiosInstance from 'src/utils/axios';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

// function createData(name, calories, fat, carbs, protein) {
//   return { name, calories, fat, carbs, protein };
// }

// const rows = [
//   createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
//   createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
//   createData('Eclair', 262, 16.0, 24, 6.0),
//   createData('Cupcake', 305, 3.7, 67, 4.3),
//   createData('Gingerbread', 356, 16.0, 49, 3.9),
// ];

export default function BasicTable() {
  const [creators, setCreators] = useState();

  //   Temporary function

  useEffect(() => {
    const getCreatorFromLandingPage = async () => {
      try {
        const res = await axiosInstance.get(`https://app.cultcreativeasia.com/landing/getCreators`);
        setCreators(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    getCreatorFromLandingPage();
  }, []);

  return (
    <>
      <CustomBreadcrumbs
        heading="List Creators"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Pronoun</TableCell>
              <TableCell>Nationality</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Instagram Username</TableCell>
              <TableCell>Tiktok Username</TableCell>
              <TableCell>Interests</TableCell>
              <TableCell>Phone number</TableCell>
              <TableCell>Languages</TableCell>
              <TableCell>BirthDate</TableCell>
              <TableCell>Employement Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {creators?.map((row) => (
              <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.pronoun}</TableCell>
                <TableCell>{row.nationality}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell>{row.instaUsername}</TableCell>
                <TableCell>{row.tiktokUsername}</TableCell>
                <TableCell>
                  {row.otherinterestsString
                    ? row.otherinterestsString
                    : JSON.stringify(row.interests)}
                </TableCell>
                <TableCell>{row.phoneNumber}</TableCell>
                <TableCell>
                  {row.otherlanguagesString
                    ? row.otherlanguagesString
                    : JSON.stringify(row.languages)}
                </TableCell>
                <TableCell>{dayjs(row.dateOfBirth).format('LL')}</TableCell>
                <TableCell>{row.employmentType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
