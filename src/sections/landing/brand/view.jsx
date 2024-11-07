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

export default function BasicTable() {
  const [brands, setBrands] = useState();

  useEffect(() => {
    const getCreatorFromLandingPage = async () => {
      try {
        const res = await axiosInstance.get(`https://app.cultcreativeasia.com/landing/getBrands`);
        setBrands(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    getCreatorFromLandingPage();
  }, []);

  return (
    <>
      <CustomBreadcrumbs
        heading="List Brands"
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
              <TableCell>Phone Number</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Company Size</TableCell>
              <TableCell>Monthly Influencer Budget</TableCell>
              <TableCell>Industry</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands?.map((row) => (
              <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.phoneNumber}</TableCell>
                <TableCell>{row.companyName}</TableCell>
                <TableCell>{row.companySize}</TableCell>
                <TableCell>{row.monthlyInfluencerBudget}</TableCell>
                <TableCell>
                  {row.otherindustriesString
                    ? row.otherindustriesString
                    : JSON.stringify(row.industries)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
