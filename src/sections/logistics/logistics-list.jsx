import PropTypes from 'prop-types';
import useSWR from 'swr';
import { useState, useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fetcher } from 'src/utils/axios';
import { LoadingScreen } from 'src/components/loading-screen';
import EmptyContent from 'src/components/empty-content';

import LogisticsTableRow from './logistics-table-row';
import LogisticsProductDrawer from './logistics-drawer';

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: '40%' },
  { id: 'product', label: 'Product Assigned', width: '40%' },
  { id: 'status', label: 'Status', width: '20%' },
];

export default function LogisticsList({ campaignId }) {
  const {
    data: logistics,
    isLoading,
    mutate,
  } = useSWR(campaignId ? `/api/logistics/campaign/${campaignId}` : null, fetcher);

  const [selectedLogisticId, setSelectedLogisticId] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const selectedLogistic = useMemo(
    () => logistics?.find((item) => item.id === selectedLogisticId),
    [logistics, selectedLogisticId]
  );

  const handleClick = (logisticId) => {
    setSelectedLogisticId(logisticId);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    // setSelectedLogisticId(null);
  };

  if (isLoading) return <LoadingScreen />;

  const notFound = !logistics || logistics.length === 0;

  return (
    <>
      <Card>
        <TableContainer sx={{ position: 'relative' }}>
          <Table>
            <TableHead>
              <TableRow>
                {TABLE_HEAD.map((heading) => (
                  <TableCell
                    key={heading.id}
                    sx={{ width: heading.width, py: 1, height: 40, color: '#231F20' }}
                  >
                    {heading.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {logistics?.map((row) => (
                <LogisticsTableRow key={row.id} row={row} onClick={() => handleClick(row.id)} />
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
        </TableContainer>
      </Card>

      <LogisticsProductDrawer
        open={openDrawer}
        onClose={handleCloseDrawer}
        logistic={selectedLogistic}
        onUpdate={mutate}
        campaignId={campaignId}
      />
    </>
  );
}

LogisticsList.propTypes = {
  campaignId: PropTypes.string,
};
