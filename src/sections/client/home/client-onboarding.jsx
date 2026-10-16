import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Box, Dialog, Divider, Typography, DialogContent } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { FONTS } from './utils';
import CompanyCreationForm from '../company-creation-form';
import ClientProfileCompletionModal from '../../auth/client-profile-completion-modal';

const companyKey = ['clientCompany'];

export function useClientCompany() {
  return useQuery({
    queryKey: companyKey,
    queryFn: () => axiosInstance.get(endpoints.client.checkCompany).then((res) => res.data),
  });
}

// Same company and profile prompts the old client dashboard showed before any campaign data.
export default function ClientOnboarding({ userEmail }) {
  const queryClient = useQueryClient();
  const { data } = useClientCompany();
  const hasCompany = data?.hasCompany;

  // Profile prompt shows once per browser session.
  const [showProfile, setShowProfile] = useState(
    () => sessionStorage.getItem('profileModalShown') !== 'true'
  );

  const refreshCompany = () => queryClient.invalidateQueries({ queryKey: companyKey });

  useEffect(() => {
    if (hasCompany) localStorage.setItem('profileCompleted', 'true');
  }, [hasCompany]);

  if (!data) return null;

  return (
    <>
      <Dialog open={!hasCompany} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <Box sx={{ py: 3, bgcolor: 'background.default' }}>
          <Typography sx={{ px: 3, pb: 2, fontSize: { xs: 26, sm: 36 }, fontFamily: FONTS.serif }}>
            Complete your Client Information
          </Typography>
          <Divider sx={{ mx: 3 }} />
          <DialogContent>
            <CompanyCreationForm
              existingCompany={data.company}
              isEdit={false}
              onSuccess={() => {
                enqueueSnackbar('Company created successfully!', { variant: 'success' });
                refreshCompany();
              }}
            />
          </DialogContent>
        </Box>
      </Dialog>

      <ClientProfileCompletionModal
        open={!hasCompany && showProfile}
        userEmail={userEmail}
        onClose={() => {
          sessionStorage.setItem('profileModalShown', 'true');
          setShowProfile(false);
        }}
        onSuccess={() => {
          sessionStorage.removeItem('profileModalShown');
          setShowProfile(false);
          refreshCompany();
        }}
      />
    </>
  );
}

ClientOnboarding.propTypes = {
  userEmail: PropTypes.string,
};
