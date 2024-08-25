import PropTypes from 'prop-types';

import { Table, TableRow, TableHead, TableCell, TableBody, TableContainer } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

const CampaignLogistics = ({ campaign }) => {
  const { user } = useAuthContext();

  const creatorLogistics = campaign?.logistic?.filter(
    (item) => item?.campaignId === campaign?.id && item?.userId === user?.id
  );

  return (
    <TableContainer sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Courier</TableCell>
            <TableCell>Tracking Number</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {creatorLogistics?.map((logistic) => (
            <TableRow key={logistic?.id}>
              <TableCell>{logistic?.itemName}</TableCell>
              <TableCell>{logistic?.courier}</TableCell>
              <TableCell>{logistic?.trackingNumber || 'None'}</TableCell>
              <TableCell>{logistic?.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CampaignLogistics;

CampaignLogistics.propTypes = {
  campaign: PropTypes.object,
};
