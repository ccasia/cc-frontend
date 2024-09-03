import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Table,
  Button,
  Dialog,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  DialogTitle,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import EmptyContent from 'src/components/empty-content';

// eslint-disable-next-line react/prop-types
const AgreementDialog = ({ open, onClose, url }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Agreement</DialogTitle>
    <DialogContent>
      <iframe
        src={url}
        title="Agreement"
        style={{ width: '100%', height: '500px', border: 'none' }}
      />
    </DialogContent>
  </Dialog>
);

const CampaignAgreements = ({ campaign }) => {
  const { data, isLoading } = useGetAgreements(campaign?.id);
  const dialog = useBoolean();
  const [selectedUrl, setSelectedUrl] = useState('');

  const handleViewAgreement = (url) => {
    setSelectedUrl(url);
    dialog.onTrue();
  };

  if (!isLoading && data.length < 1) {
    return <EmptyContent title="No agreements found" />;
  }

  return (
    <Box>
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Creator&apos;s name</TableCell>
              <TableCell>Creator&apos;s email</TableCell>
              <TableCell>Agreement PDF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item?.user?.name}</TableCell>
                  <TableCell>{item?.user?.email}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleViewAgreement(item?.agreementUrl)}
                      size="small"
                      variant="outlined"
                    >
                      View Agreement
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AgreementDialog open={dialog.value} onClose={dialog.onFalse} url={selectedUrl} />
    </Box>
  );
};

CampaignAgreements.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignAgreements;
