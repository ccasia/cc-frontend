import { useState, useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Dialog,
  Typography,
  Container,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';
import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import CompanyCreationForm from './company-creation-form';

export default function ClientDashboard() {
  const { user } = useAuthContext();
  const settings = useSettingsContext();
  
  const [hasCompany, setHasCompany] = useState(null);
  const [company, setCompany] = useState(null);
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);

  const checkClientCompany = async () => {
    try {
      setIsCheckingCompany(true);
      const response = await axiosInstance.get(endpoints.client.checkCompany);
      setHasCompany(response.data.hasCompany);
      setCompany(response.data.company);
      
      if (!response.data.hasCompany) {
        setOpenCompanyDialog(true);
      }
    } catch (error) {
      console.error('Error checking client company:', error);
      enqueueSnackbar('Error checking company status', { variant: 'error' });
    } finally {
      setIsCheckingCompany(false);
    }
  };

  useEffect(() => {
    checkClientCompany();
  }, []);

  const handleCompanyCreated = (newCompany) => {
    setHasCompany(true);
    setCompany(newCompany);
    setOpenCompanyDialog(false);
    enqueueSnackbar('Company created successfully!', { variant: 'success' });
  };

  if (isCheckingCompany) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        <Box sx={{ py: 5 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Box sx={{ py: 5 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Welcome back, {user?.name}!
        </Typography>

        {hasCompany ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Company Information</Typography>
                  <Typography variant="body1">
                    <strong>Company Name:</strong> {company?.name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email:</strong> {company?.email}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Type:</strong> {company?.type}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Client ID:</strong> {company?.clientId}
                  </Typography>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Quick Actions</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="eva:plus-outline" />}
                    disabled
                  >
                    Create Campaign
                  </Button>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Complete your Client Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              To get started, please create your company profile.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-outline" />}
              onClick={() => setOpenCompanyDialog(true)}
            >
              Create Company
            </Button>
          </Card>
        )}
      </Box>

      <Dialog
        open={openCompanyDialog}
        onClose={() => !hasCompany ? null : setOpenCompanyDialog(false)}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={!hasCompany}

      >
        <Box paddingY={3} bgcolor={'#F4F4F4'}>
          <Typography px={3} pb={2} fontSize={{ xs: 26, sm: 36}} fontFamily={'Instrument Serif'}>
            Complete your Client Information
          </Typography>
          <Divider sx={{ mx: 3 }} />
          <DialogContent>
            <CompanyCreationForm
              onSuccess={handleCompanyCreated}
              existingCompany={company}
              isEdit={hasCompany}
            />
          </DialogContent>
          {hasCompany && (
            <DialogActions>
              <Button onClick={() => setOpenCompanyDialog(false)}>
                Cancel
              </Button>
            </DialogActions>
          )}
        </Box>
      </Dialog>
      
    </Container>
  );
}