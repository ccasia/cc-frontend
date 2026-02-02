import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Stack,
  Button,
  Dialog,
  Divider,
  Container,
  TextField,
  Typography,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompanyById from 'src/hooks/use-get-company-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';

import PackageCreateDialog from 'src/sections/packages/package-dialog';

import PICList from './pic/pic-list';
import CompanyEditForm from './edit-from';
import CreateBrand from './brands/create/create-brand';
import PackageHistoryList from './pakcage-history-list';
import ChildAccountList from './child-accounts/child-account-list';
import CampaignClientList from './campaign-client/view/campaign-list';

const findLatestPackage = (packages) => {
  if (packages?.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};

const defaultValues = {
  companyLogo: {},
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  companyWebsite: '',
  companyAbout: '',
  type: '',
  companyId: '',
  companyRegistrationNumber: '',
};

const companySchema = Yup.object().shape({
  companyName: Yup.string().required('Name is required'),
  // companyEmail: Yup.string()
  //   .required('Email is required')
  //   .email('Email must be a valid email address'),
  companyPhone: Yup.string().required('Phone is required'),
  // companyAddress: Yup.string().required('Address is required'),
  // companyWebsite: Yup.string().required('Website is required'),
  // companyAbout: Yup.string().required('About Description is required'),
  // companyRegistrationNumber: Yup.string().required('RegistrationNumber is required'),
  type: Yup.string().required('Client type is required'),
});

const CompanyEditView = ({ id }) => {
  const { user } = useAuthContext();
  const { data: company, isLoading, mutate } = useGetCompanyById(id);
  const [loading, setLoading] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [picDialogOpen, setPicDialogOpen] = useState(false);
  const [picFormData, setPicFormData] = useState({
    name: '',
    email: '',
    designation: '',
  });
  const router = useRouter();
  const dialog = useBoolean();
  const packageDialog = useBoolean();
  const [activeTab, setActiveTab] = useState('package');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [inviteChildDialog, setInviteChildDialog] = useState(false);
  const [mainPicStatus, setMainPicStatus] = useState(null);

  // Fetch main PIC user status
  useEffect(() => {
    const fetchPICStatus = async () => {
      if (!company?.pic?.[0]?.email) {
        setMainPicStatus(null);
        return;
      }

      try {
        // Normalize email to lowercase for case-insensitive matching
        const response = await axiosInstance.get(`/api/user/by-email/${company.pic[0].email?.toLowerCase()}`);
        setMainPicStatus(response.data?.status || null);
      } catch (error) {
        console.error('Error fetching PIC status:', error);
        setMainPicStatus(null);
      }
    };

    fetchPICStatus();
  }, [company?.pic]);

  console.log('Company info: ', company)
  console.log('Has active client: ', company?.clients?.some(client => client.companyId === company.id))

  // Check if client is activated: if inviteToken is null/empty, the client has activated
  const hasActiveClient = company?.clients?.some(client => client.companyId === company.id) || false;

  // Check if company has a valid PIC with email (required for activation)
  const hasValidPIC = company?.pic?.length > 0 && Boolean(company.pic[0]?.email);

  // Check if main PIC has activated their account (status is 'active', not 'pending')
  const isPicActivated = mainPicStatus === 'active';

  // Can invite child accounts only if client exists AND main PIC is activated
  const canInviteChildAccounts = hasActiveClient && isPicActivated;

  const campaigns = useMemo(() => {
    if (company?.type === 'agency' || company?.brand?.length) {
      return company?.brand?.flatMap((item) => item?.campaign);
    }
    return company?.campaign;
  }, [company]);

  const currentPackage = useMemo(
    () => (company?.subscriptions?.length ? findLatestPackage(company?.subscriptions) : null),
    [company]
  );

  const creditSummary = useMemo(() => {
    if (!company?.subscriptions || company.subscriptions.length === 0) {
      return { totalCredits: 0, usedCredits: 0, remainingCredits: 0, hasActivePackage: false };
    }

    const activeSubscriptions = company.subscriptions.filter((sub) => sub.status === 'ACTIVE');

    if (activeSubscriptions.length === 0) {
      return { totalCredits: 0, usedCredits: 0, remainingCredits: 0, hasActivePackage: false };
    }
    // Sum the credits from all active subscriptions
    const totalCredits = activeSubscriptions.reduce((sum, sub) => sum + (sub.totalCredits || 0), 0);
    const usedCredits = activeSubscriptions.reduce((sum, sub) => sum + (sub.creditsUsed || 0), 0);

    return {
      totalCredits,
      usedCredits,
      remainingCredits: totalCredits - usedCredits,
      hasActivePackage: true,
    };
  }, [company?.subscriptions]);

  const methods = useForm({
    resolver: yupResolver(companySchema),
    defaultValues,
  });

  const { handleSubmit, reset, control, formState: { isDirty } } = methods;

  const fieldsArray = useFieldArray({
    control,
    name: 'companyObjectives',
  });

  useEffect(() => {
    reset({
      companyId: company?.clientId,
      companyLogo: company?.logo,
      companyName: company?.name,
      companyEmail: company?.email,
      companyPhone: company?.phone,
      companyAddress: company?.address,
      companyWebsite: company?.website,
      companyAbout: company?.about,
      companyObjectives: company?.objectives,
      companyRegistrationNumber: company?.registration_number,
      type: company?.type,
    });
  }, [company, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();

    const newData = {
      ...data,
      companyId: company?.id,
      // companyObjectives: data.companyObjectives.filter((item) => item.value !== ''),
    };

    formData.append('data', JSON.stringify(newData));
    formData.append('companyLogo', data.companyLogo);

    try {
      setLoading(true);
      const res = await axiosInstance.patch(endpoints.company.edit, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      mutate();
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error has occured', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  });

  const handleActivateButtonClick = () => {
    // Check if PIC exists, if not show PIC creation modal
    if (!hasValidPIC) {
      setPicDialogOpen(true);
    } else {
      setActivateDialogOpen(true);
    }
  };

  const handleCreatePIC = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/pic', {
        ...picFormData,
        companyId: company?.id,
      });

      enqueueSnackbar(response.data.message || 'PIC created successfully', { variant: 'success' });
      setPicDialogOpen(false);
      setPicFormData({ name: '', email: '', designation: '' });
      mutate(); // Refresh company data
      
      // After creating PIC, show activation dialog
      setTimeout(() => {
        setActivateDialogOpen(true);
      }, 300);
    } catch (error) {
      console.error('Error creating PIC:', error);
      const errorMessage = error.response?.data?.message || 'Error creating PIC';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateClient = async () => {
    setIsActivating(true);
    try {
      const response = await axiosInstance.post(`${endpoints.company.root}/activateClient/${id}`);
      
      if (response.status === 200) {
        enqueueSnackbar('Client activation email sent successfully!', {
          variant: 'success',
        });
        setActivateDialogOpen(false);
        mutate(); // Refresh company data
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error activating client';
      enqueueSnackbar(errorMessage, {
        variant: 'error',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const onClose = useCallback(() => {
    dialog.onFalse();
  }, [dialog]);

  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'relative',
          top: 200,
          textAlign: 'center',
        }}
      >
        <CircularProgress
          thickness={7}
          size={25}
          sx={{
            color: (theme) => theme.palette.common.black,
            strokeLinecap: 'round',
          }}
        />
      </Box>
    );
  }

  const handlePackageLinkSuccess = () => {
    packageDialog.onFalse(); 
    mutate(); 
    enqueueSnackbar('New package added successfully!', { variant: 'success' }); 
  };

  return (
    <Container maxWidth="lg">
      <Button
        startIcon={<Iconify icon="ion:chevron-back" />}
        onClick={() => router.push(paths.dashboard.company.discover)}
        variant="outlined"
      >
        Back
      </Button>

      <Box
        sx={{
          bgcolor: (theme) => theme.palette.background.paper,
          p: 3,
          borderRadius: 2,
          mt: 3,
        }}
      >
        <Box
          mb={3}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontSize: 40,
              fontWeight: 'normal',
            }}
          >
            {company?.brand?.length ? 'Agency' : 'Client'} Information
          </Typography>

          {creditSummary.hasActivePackage && (
            <Label color="success">Total Remaining Credits: {creditSummary.remainingCredits}</Label>
          )}
        </Box>

        <FormProvider methods={methods} onSubmit={onSubmit}>
          <CompanyEditForm company={company} fieldsArray={fieldsArray} methods={methods} />

          <Box textAlign="end" mt={2}>
            {(user?.role === 'superadmin' || user?.role === 'admin') && (
              <Button
                variant={hasActiveClient ? 'outlined' : 'contained'}
                startIcon={hasActiveClient ? <Iconify icon="eva:checkmark-circle-2-fill" /> : null}
                onClick={handleActivateButtonClick}
                disabled={hasActiveClient}
                sx={{
                  bgcolor: hasActiveClient ? 'white' : '#203ff5',
                  color: hasActiveClient ? '#1ABF66' : 'white',
                  border: '1px solid',
                  borderColor: hasActiveClient ? '#1ABF66' : '#1a32c4',
                  borderBottom: hasActiveClient ? '2px solid #1ABF66' : '3px solid #102387',
                  borderRadius: '8px',
                  px: 2,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  '&.Mui-disabled': {
                    bgcolor: 'white',
                    color: '#1ABF66',
                    borderColor: '#1ABF66',
                    opacity: 1,
                  },
                  '&:hover': {
                    bgcolor: hasActiveClient ? 'white' : '#1a32c4',
                  },
                }}
              >
                {hasActiveClient ? 'Account Activated' : 'Activate Account'}
              </Button>
            )}
            <LoadingButton
              loading={loading}
              type="submit"
              variant="contained"
              disabled={!isDirty}
              sx={{
                ml: 1,
                px: 3,
                py: 0.75,
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor: isDirty ? '#1340FF' : '#E7E7E7',
                color: isDirty ? 'white' : '#8E8E93',
                border: '1px solid',
                borderColor: isDirty ? '#1a32c4' : '#E7E7E7',
                borderBottom: isDirty ? '3px solid #102387' : '3px solid #C4CDD5',
                '&:hover': {
                  bgcolor: isDirty ? '#1a32c4' : '#E7E7E7',
                },
                '&.Mui-disabled': {
                  bgcolor: '#E7E7E7',
                  color: '#8E8E93',
                },
              }}
            >
              Save
            </LoadingButton>
          </Box>
        </FormProvider>

        <Card
          sx={{
            borderRadius: 2,
            mt: 3,
            border: '1px solid #EBEBEB',
            boxShadow: 'none',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2.5,
              bgcolor: '#FAFAFA',
              borderBottom: '1px solid #EBEBEB',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, val) => {
                setActiveTab(val);
                setCampaignSearch(''); // Reset search when switching tabs
              }}
              sx={{
                minHeight: 52,
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: 14,
                  minHeight: 52,
                  textTransform: 'none',
                  color: '#636366',
                  '&:hover': {
                    color: '#221f20',
                  },
                },
                '& .Mui-selected': {
                  color: '#1340FF !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#1340FF',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab value="package" label="Package" />
              <Tab
                value="campaign"
                label="Campaign"
                iconPosition="end"
                icon={<Label color="default">{campaigns?.length || 0}</Label>}
              />
              <Tab value="pic" label="Person In Charge" />
              <Tab value="child-accounts" label="Child Accounts" />
            </Tabs>

            {/* Tab Action Bar */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {activeTab === 'campaign' && (
                <TextField
                  size="small"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: '#8E8E93', width: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 220,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: '8px',
                      fontSize: 14,
                      '& fieldset': {
                        borderColor: '#E7E7E7',
                      },
                      '&:hover fieldset': {
                        borderColor: '#C4CDD5',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1340FF',
                        borderWidth: 1,
                      },
                    },
                    '& .MuiInputBase-input': {
                      py: 1,
                    },
                  }}
                />
              )}

              {activeTab === 'package' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Iconify icon="eva:plus-fill" width={18} />}
                  onClick={packageDialog.onTrue}
                  sx={{
                    bgcolor: '#1340FF',
                    border: '1px solid #1a32c4',
                    borderBottom: '3px solid #102387',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: 13,
                    px: 2,
                    py: 1,
                    minHeight: 40,
                    '&:hover': { bgcolor: '#1a32c4' },
                  }}
                >
                  Add Package
                </Button>
              )}

              {activeTab === 'child-accounts' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Iconify icon="eva:plus-fill" width={18} />}
                  onClick={() => setInviteChildDialog(true)}
                  disabled={!canInviteChildAccounts}
                  sx={{
                    bgcolor: '#1340FF',
                    border: '1px solid #1a32c4',
                    borderBottom: '3px solid #102387',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: 13,
                    px: 2,
                    py: 1,
                    minHeight: 40,
                    '&:hover': { bgcolor: '#1a32c4' },
                    '&.Mui-disabled': {
                      bgcolor: '#E7E7E7',
                      color: '#8E8E93',
                      borderColor: '#E7E7E7',
                      borderBottom: '3px solid #C4CDD5',
                    },
                  }}
                >
                  Invite Account
                </Button>
              )}
            </Stack>
          </Box>

          <Box p={2}>
            {activeTab === 'package' && (
              <>
                {!company?.subscriptions || company.subscriptions.length === 0 ? (
                  <Stack spacing={2} alignItems="center">
                    <Typography variant="subtitle1" color="text.secondary">
                      No package is connected
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ boxShadow: '0px -3px 0px 0px #E7E7E7 inset' }}
                      startIcon={<Iconify icon="bx:package" width={22} />}
                      onClick={packageDialog.onTrue}
                    >
                      Connect package
                    </Button>
                  </Stack>
                ) : (
                  <PackageHistoryList
                      dataFiltered={company?.subscriptions}
                      onRefresh={() => mutate()}
                    />
                )}
              </>
            )}

            {activeTab === 'campaign' && <CampaignClientList campaigns={campaigns} searchFilter={campaignSearch} />}

            {activeTab === 'pic' && (
              <PICList personIncharge={company?.pic} companyId={company?.id} onUpdate={mutate} />
            )}

            {activeTab === 'child-accounts' && (
              <ChildAccountList
                company={company}
                inviteDialogOpen={inviteChildDialog}
                onInviteDialogClose={() => setInviteChildDialog(false)}
                isPicActivated={isPicActivated}
              />
            )}
          </Box>
        </Card>
      </Box>

      {/* Create new brand dialog */}
      <Dialog open={dialog.value}>
        <DialogContent>
          <CreateBrand companyId={company?.id} onClose={onClose} />
        </DialogContent>
      </Dialog>

      {/* <PackageCreate open={packageDialog.value} onClose={packageDialog.onFalse} /> */}

      {/* <PackageCreateDialog packageDialog={packageDialog} companyId={id} /> */}
      <PackageCreateDialog
        open={packageDialog.value}
        onClose={packageDialog.onFalse}
        clientId={id}
        onRefresh={handlePackageLinkSuccess}
      />

      {/* PIC Creation Dialog */}
      <Dialog open={picDialogOpen} onClose={() => setPicDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: '#F0F4FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:user-id-bold" width={22} sx={{ color: '#1340FF' }} />
            </Box>
            <Box>
              <Typography fontSize={28} fontFamily="Instrument Serif">
                Add Person In Charge
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please provide PIC information to activate this client account
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Divider sx={{ mx: 2 }} />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Name"
              value={picFormData.name}
              onChange={(e) => setPicFormData({ ...picFormData, name: e.target.value })}
              fullWidth
              required
              placeholder="Enter name"
            />
            <TextField
              label="Email"
              type="email"
              value={picFormData.email}
              onChange={(e) => setPicFormData({ ...picFormData, email: e.target.value })}
              fullWidth
              required
              placeholder="Enter email address"
            />
            <TextField
              label="Designation"
              value={picFormData.designation}
              onChange={(e) => setPicFormData({ ...picFormData, designation: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Manager, Director"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setPicDialogOpen(false);
              setPicFormData({ name: '', email: '', designation: '' });
            }}
            disabled={loading}
            sx={{
              border: '1px solid #E7E7E7',
              borderRadius: '8px',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleCreatePIC}
            variant="contained"
            loading={loading}
            disabled={!picFormData.name || !picFormData.email || !picFormData.designation}
            sx={{
              bgcolor: '#1340FF',
              borderRadius: '8px',
              border: '1px solid #1a32c4',
              borderBottom: '3px solid #102387',
              px: 3,
              '&:hover': { bgcolor: '#1a32c4' },
              '&.Mui-disabled': {
                bgcolor: '#E7E7E7',
                color: '#8E8E93',
                border: '1px solid #E7E7E7',
                borderBottom: '3px solid #C4CDD5',
              },
            }}
          >
            Save & Continue
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Client Activation Dialog */}
      <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="eva:checkmark-circle-2-fill" width={22} sx={{ color: '#1ABF66' }} />
            </Box>
            <Box>
              <Typography fontSize={28} fontFamily="Instrument Serif">
                Activate Client Account?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Send activation email to the PIC
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Divider sx={{ mx: 2 }} />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Company Name</Typography>
              <Typography variant="body2" fontWeight={600}>{company?.name || 'N/A'}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">PIC Email</Typography>
              <Typography variant="body2" fontWeight={600}>{company?.pic?.[0]?.email || 'N/A'}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Package</Typography>
              <Typography variant="body2" fontWeight={600}>
                {currentPackage?.package?.name || currentPackage?.customPackage?.customName || 'No package assigned'}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setActivateDialogOpen(false)}
            disabled={isActivating}
            sx={{
              border: '1px solid #E7E7E7',
              borderRadius: '8px',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              px: 3,
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleActivateClient}
            variant="contained"
            loading={isActivating}
            sx={{
              bgcolor: '#1ABF66',
              borderRadius: '8px',
              border: '1px solid #15A35A',
              borderBottom: '3px solid #0D8A4A',
              px: 3,
              '&:hover': { bgcolor: '#15A35A' },
            }}
          >
            Activate
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompanyEditView;

CompanyEditView.propTypes = {
  id: PropTypes.string,
};
