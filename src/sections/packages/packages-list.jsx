import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import PackageItem from './packages-item';

const PackageLists = ({ packages }) => {
  const router = useRouter();

  const onView = (id) => {
    router.push(paths.dashboard.packages.manage(id));
  };

  return (
    <Box mt={2}>
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>UGC Credits</TableCell>
              <TableCell>Validity Period</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {packages?.map((item) => (
              <PackageItem key={item.id} packageItem={item} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PackageLists;

PackageLists.propTypes = {
  packages: PropTypes.array,
};
