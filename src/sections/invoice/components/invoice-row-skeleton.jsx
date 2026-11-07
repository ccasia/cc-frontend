import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

const ROWS = [
  { name: 96, number: 64, amount: 56 },
  { name: 120, number: 60, amount: 64 },
  { name: 84, number: 68, amount: 52 },
  { name: 108, number: 62, amount: 60 },
  { name: 92, number: 66, amount: 56 },
];

// Text bones sit inside the real text styles, so each row keeps the real row height.
const Text = ({ width }) => <Skeleton variant="text" width={width} />;

Text.propTypes = { width: PropTypes.number };

function DateCell() {
  return (
    <TableCell sx={{ width: 120 }}>
      <ListItemText
        primary={<Text width={80} />}
        secondary={<Text width={48} />}
        primaryTypographyProps={{ typography: 'body2', noWrap: true }}
        secondaryTypographyProps={{ mt: 0.5, component: 'span', typography: 'caption' }}
      />
    </TableCell>
  );
}

function InvoiceRowSkeleton({ row }) {
  return (
    <TableRow
      sx={{
        height: 86,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '& td': { py: 2 },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <TableCell sx={{ width: 300, display: 'flex', alignItems: 'center' }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2, flexShrink: 0 }} />
        <ListItemText
          disableTypography
          primary={
            <Typography variant="body2" sx={{ mt: 1 }}>
              <Text width={row.name} />
            </Typography>
          }
          secondary={
            <Typography variant="body2" sx={{ mt: 0.5, lineHeight: '17px' }}>
              <Text width={row.number} />
            </Typography>
          }
        />
      </TableCell>
      <DateCell />
      <DateCell />
      <TableCell sx={{ width: 100 }}>
        <Typography variant="body2">
          <Text width={row.amount} />
        </Typography>
      </TableCell>
      <TableCell sx={{ width: 100 }}>
        <Skeleton width={64} height={31} sx={{ borderRadius: 0.8 }} />
      </TableCell>
      <TableCell sx={{ width: 240, px: 2, verticalAlign: 'middle' }}>
        <Stack direction="row" spacing={1}>
          <Skeleton width={65} height={32} sx={{ borderRadius: 0.8 }} />
          <Skeleton width={69} height={32} sx={{ borderRadius: 0.8 }} />
          <Skeleton width={65} height={32} sx={{ borderRadius: 0.8 }} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

InvoiceRowSkeleton.propTypes = { row: PropTypes.object };

export default function InvoiceRowsSkeleton({ count = 5 }) {
  return Array.from({ length: count }, (_, index) => (
    <InvoiceRowSkeleton key={index} row={ROWS[index % ROWS.length]} />
  ));
}

InvoiceRowsSkeleton.propTypes = { count: PropTypes.number };
