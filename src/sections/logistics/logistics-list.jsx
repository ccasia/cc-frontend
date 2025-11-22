import PropTypes from 'prop-types';
import useSWR from 'swr';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fetcher } from 'src/utils/axios';
import Scrollbar from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import EmptyContent from 'src/components/empty-content';

import LogisticsTableRow from './logistics-table-row';

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: '25%' },
  { id: 'product', label: 'Product Assigned', width: '20%' },
  { id: 'status', label: 'Status', width: '45%' },
  { id: 'action', label: '', width: '10%' },
];

export default function LogisticsList({ campaignId }) {
  const {
    data: logistics,
    isLoading,
    mutate,
  } = useSWR(campaignId ? `/api/campaign/${campaignId}/logistics` : null, fetcher);

  if (isLoading) return <LoadingScreen />;

  const notFound = !logistics || logistics.length === 0;

  return (
    <Card>
      <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((heading) => (
                  <TableCell key={heading.id} sx={{ width: heading.width }}>
                    {heading.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {logistics?.map((row) => (
                <LogisticsTableRow key={row.id} row={row} onUpdate={() => mutate()} />
              ))}

              {notFound && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyContent
                      title="No deliveries scheduled"
                      description="Click 'Edit & Bulk Assign' to get started."
                      imgUrl="/assets/icons/empty/ic_content.svg"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

LogisticsList.propTypes = {
  campaignId: PropTypes.string,
};
