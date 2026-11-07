import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

const ROWS = [
  { name: 120, middle: 180, slot: 130, chip: 96 },
  { name: 96, middle: 140, slot: 110, chip: 84 },
  { name: 140, middle: 210, slot: 150, chip: 104 },
  { name: 108, middle: 160, slot: 120, chip: 72 },
  { name: 88, middle: 190, slot: 140, chip: 92 },
];

export default function LogisticsTableSkeleton({ tableHead, isReservation }) {
  return (
    <Card aria-busy="true" aria-label="Loading">
      <TableContainer sx={{ position: 'relative', maxHeight: 450 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {tableHead.map((heading) => (
                <TableCell
                  key={heading.id}
                  align={heading.align || 'left'}
                  sx={{ width: heading.width, py: 1, height: 40, color: '#231F20' }}
                >
                  {heading.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {ROWS.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Skeleton
                      variant="circular"
                      width={40}
                      height={40}
                      sx={{ mr: { xs: 1, md: 2 }, flexShrink: 0 }}
                    />
                    <Skeleton width={row.name} height={14} />
                  </Box>
                </TableCell>

                <TableCell align="center" sx={{ width: '30%' }}>
                  <Stack alignItems="center" spacing={1}>
                    <Skeleton width={row.middle} height={14} />
                    {isReservation && <Skeleton width={row.slot} height={12} />}
                  </Stack>
                </TableCell>

                <TableCell sx={{ width: '20%' }}>
                  <Box sx={{ display: 'flex', pr: 2 }}>
                    <Skeleton
                      width={row.chip}
                      sx={{ height: { xs: 28, sm: 30 }, borderRadius: '6px' }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={3} sx={{ height: 52, px: 2 }}>
        <Skeleton width={110} height={12} />
        <Skeleton width={70} height={12} />
      </Stack>
    </Card>
  );
}

LogisticsTableSkeleton.propTypes = {
  tableHead: PropTypes.array,
  isReservation: PropTypes.bool,
};
