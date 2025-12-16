import axios from 'axios';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { Page, Document } from 'react-pdf';
import { useForm, FormProvider } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Box,
  Chip,
  Stack,
  Paper,
  Radio,
  Dialog,
  Button,
  Select,
  Avatar,
  Divider,
  MenuItem,
  IconButton,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  OutlinedInput,
  FormHelperText,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';
import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { RHFMultiSelect } from 'src/components/hook-form';

import PDFEditorModal from 'src/sections/campaign/create/pdf-editor';

// ----------------------------------------------------------------------

export default function ActivateCampaignDialog({ open, onClose, campaignId, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  
  // Check if user is superadmin/CSL
  const isCSL = user?.admin?.role?.name === 'CSL';
  const isSuperAdmin = user?.admin?.mode === 'god';
  const isSuperUser = isCSL || isSuperAdmin;
  
  // Check if user is CSM (for completing activation)
  const isCSM = user?.admin?.role?.name === 'CSM' || user?.admin?.role?.name === 'Customer Success Manager';
  
  console.log('ActivateCampaignDialog - User check:', {
    userRole: user?.role,
    adminMode: user?.admin?.mode,
    adminRole: user?.admin?.role?.name,
    isSuperUser,
    isCSM
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [campaignType, setCampaignType] = useState('');
  // Remove local deliverables state, use RHF only

  // RHF setup for deliverables step only
  const deliverablesForm = useForm({
    defaultValues: { deliverables: [] },
  });
  // Always use this for the current deliverables value
  const deliverablesWatch = deliverablesForm.watch('deliverables');
  const [campaignManagers, setCampaignManagers] = useState([]);
  const [agreementTemplateId, setAgreementTemplateId] = useState('');
  
  const [adminOptions, setAdminOptions] = useState([]);
  const [, setAgreementTemplates] = useState([]); // agreementTemplates unused
  const [campaignDetails, setCampaignDetails] = useState(null);
  
  // Posting dates state
  const [postingStartDate, setPostingStartDate] = useState(null);
  const [postingEndDate, setPostingEndDate] = useState(null);
  
  // Step state (1: Admin Assignment, 2: Agreement, 3: Campaign Type, 4: Deliverables, 5: Posting Dates)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form validation
  const [errors, setErrors] = useState({
    campaignType: '',
    deliverables: '',
    campaignManagers: '',
    agreementTemplateId: '',
    postingStartDate: '',
    postingEndDate: '',
  });

  // PDF related states
  const pdfModal = useBoolean();
  const templateModal = useBoolean();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pages, setPages] = useState(0);
  const [, setDisplayPdf] = useState(null); // displayPdf unused
  const lgUp = useResponsive('up', 'lg');

  // Add debugging for admin data structure
  useEffect(() => {
    if (adminOptions.length > 0) {
      console.log('Admin structure example:', adminOptions[0]);
      console.log('Admin IDs being used:', adminOptions.map(admin => ({
        id: admin.id,
        userId: admin.userId,
        userName: admin.user?.name
      })));
    }
  }, [adminOptions]);

  // Add debugging for selected admins
  useEffect(() => {
    if (campaignManagers.length > 0) {
      console.log('Selected admin IDs:', campaignManagers);
      const selectedAdmins = adminOptions.filter(admin => 
        campaignManagers.includes(admin.userId)
      );
      console.log('Selected admin details:', selectedAdmins.map(admin => ({
        id: admin.id,
        userId: admin.userId,
        userName: admin.user?.name
      })));
    }
  }, [campaignManagers, adminOptions]);

  // Fetch campaign details, admin users, and agreement templates
  useEffect(() => {
    if (open && campaignId) {
      setLoading(true);
      
      // Fetch campaign details
      axios.get(`/api/campaign/getCampaignById/${campaignId}`)
        .then((response) => {
          if (response.data) {
            setCampaignDetails(response.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching campaign details:', error);
          enqueueSnackbar('Failed to fetch campaign details', { variant: 'error' });
        });
      
      // Fetch admin users with CSM role
      axios.get('/api/admin/getAllAdmins')
        .then((response) => {
          if (response.data) {
            // Filter for admins with CSM role - check for various possible role names
            const csmAdmins = response.data.filter(admin => 
              admin.role?.name === 'CSM' || 
              admin.role?.name === 'Customer Success Manager' ||
              admin.role?.name?.toLowerCase().includes('csm') ||
              admin.role?.name?.toLowerCase().includes('customer success')
            );
            
            if (csmAdmins.length === 0) {
              console.warn('No CSM admins found in the system');
            }
            
            // Log the admin data for debugging
            console.log('CSM Admins found:', csmAdmins);
            
            setAdminOptions(csmAdmins);
          }
        })
        .catch((error) => {
          console.error('Error fetching admin users:', error);
          enqueueSnackbar('Failed to fetch admin users', { variant: 'error' });
          // Set empty array to prevent undefined errors
          setAdminOptions([]);
        });
      
      // Fetch agreement templates
      axios.get('/api/campaign/template')
        .then((response) => {
          if (response.data) {
            setAgreementTemplates(response.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching agreement templates:', error);
          enqueueSnackbar('Failed to fetch agreement templates', { variant: 'error' });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, campaignId, enqueueSnackbar]);

  // Update current step when campaign details are loaded
  useEffect(() => {
    if (campaignDetails) {
      // If user is admin/CSM and campaign is PENDING_ADMIN_ACTIVATION, skip admin assignment (step 1)
      if ((isCSM || user?.role === 'admin') && campaignDetails?.status === 'PENDING_ADMIN_ACTIVATION') {
        setCurrentStep(2); // Start at Agreement Form
        
        // Pre-fill admin managers from campaign admin list
        if (campaignDetails?.campaignAdmin && campaignDetails.campaignAdmin.length > 0) {
          const assignedAdminIds = campaignDetails.campaignAdmin.map(admin => 
            admin.adminId || admin.admin?.userId || admin.admin?.user?.id
          ).filter(Boolean);
          setCampaignManagers(assignedAdminIds);
        }
      } else {
        setCurrentStep(1); // Start at Admin Assignment
      }
    }
  }, [campaignDetails, isCSM, user?.role]);

  // Only update RHF state, not local
  const handleDeliverableChange = (valueOrEvent) => {
    let value = valueOrEvent;
    if (valueOrEvent && valueOrEvent.target) {
      value = typeof value === 'string' ? value.split(',') : value;
    }
    setErrors((prev) => ({ ...prev, deliverables: '' }));
    deliverablesForm.setValue('deliverables', value);
  };

  // No need to sync local state to RHF anymore

  const handleAdminManagerChange = (event) => {
    const { value } = event.target;
    setCampaignManagers(typeof value === 'string' ? value.split(',') : value);
    setErrors((prev) => ({ ...prev, campaignManagers: '' }));
  };

  // Debug: log RHF deliverables value
  console.log('Deliverables (RHF): ', deliverablesForm.getValues('deliverables'));

  const validateForm = () => {
    // Skip admin manager validation for admin/CSM users completing activation
    const skipAdminValidation = (isCSM || user?.role === 'admin') && campaignDetails?.status === 'PENDING_ADMIN_ACTIVATION';
    
    const getCampaignManagersError = () => {
      if (skipAdminValidation) return '';
      if (adminOptions.length === 0) {
        return 'No CSM admins available in the system. Please create a CSM role admin first.';
      }
      if (campaignManagers.length === 0) {
        return 'At least one admin manager is required';
      }
      return '';
    };

    // Always get the latest deliverables value from RHF
    const currentDeliverables = deliverablesForm.getValues('deliverables');
    
    // Posting date validation - only required for 'normal' (UGC With Posting) campaign type
    const requiresPostingDates = campaignType === 'normal';
    
    const getPostingStartDateError = () => {
      if (!requiresPostingDates) return '';
      if (!postingStartDate) return 'Posting start date is required';
      return '';
    };
    
    const getPostingEndDateError = () => {
      if (!requiresPostingDates) return '';
      if (!postingEndDate) return 'Posting end date is required';
      if (postingStartDate && postingEndDate && dayjs(postingEndDate).isBefore(dayjs(postingStartDate))) {
        return 'End date must be after start date';
      }
      return '';
    };
    
    const newErrors = {
      campaignType: !campaignType ? 'Campaign type is required' : '',
      deliverables: !currentDeliverables || currentDeliverables.length === 0 ? 'At least one deliverable is required' : '',
      campaignManagers: getCampaignManagersError(),
      agreementTemplateId: !agreementTemplateId ? 'Agreement template is required' : '',
      postingStartDate: getPostingStartDateError(),
      postingEndDate: getPostingEndDateError(),
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some((error) => error);
  };

  // handleInitialActivate is unused, remove to fix lint warning

  const handleActivate = async () => {
    if (!validateForm()) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Log what we're sending to help debug
      const currentDeliverables = deliverablesForm.getValues('deliverables');
      console.log('Sending data:', {
        campaignType,
        deliverables: currentDeliverables,
        campaignManager: campaignManagers,
        agreementTemplateId,
        postingStartDate: postingStartDate ? dayjs(postingStartDate).toISOString() : null,
        postingEndDate: postingEndDate ? dayjs(postingEndDate).toISOString() : null,
      });
      
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        campaignType,
        deliverables: currentDeliverables,
        campaignManager: campaignManagers, // These are the admin user IDs
        agreementTemplateId,
        postingStartDate: postingStartDate ? dayjs(postingStartDate).toISOString() : null,
        postingEndDate: postingEndDate ? dayjs(postingEndDate).toISOString() : null,
        status: 'ACTIVE', // Explicitly set status to ACTIVE
      }));
      
      const response = await axios.post(`/api/campaign/activateClientCampaign/${campaignId}`, formData);
      console.log('Activation response:', response.data);
      
      // Get assigned admin names for success message
      const assignedAdminNames = adminOptions
        .filter(admin => campaignManagers.includes(admin.userId))
        .map(admin => admin.user?.name || admin.name)
        .join(', ');
      
      const campaignName = campaignDetails?.name ? `"${campaignDetails.name}"` : 'Campaign';
      
      const successMessage = assignedAdminNames 
        ? `🎉 ${campaignName} successfully activated and assigned to ${assignedAdminNames}! The campaign is now live and ready for creator submissions.`
        : `🎉 ${campaignName} activated successfully and assigned to CSM admins! The campaign is now live and ready for creator submissions.`;
      
      enqueueSnackbar(successMessage, { variant: 'success' });
      onClose();
      
      // Trigger data revalidation
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error activating campaign:', error);
      console.error('Error details:', error.response?.data);
      enqueueSnackbar(error.response?.data?.message || 'Failed to activate campaign', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      // Reset form state
      setCampaignType('');
      setCampaignManagers([]);
      setAgreementTemplateId('');
      setPostingStartDate(null);
      setPostingEndDate(null);
      
      // Reset step based on user role and campaign status
      if ((isCSM || user?.role === 'admin') && campaignDetails?.status === 'PENDING_ADMIN_ACTIVATION') {
        setCurrentStep(2); // Start at Agreement Form for admin/CSM
      } else {
        setCurrentStep(1); // Start at Admin Assignment for superadmin/CSL
      }
      
      setErrors({
        campaignType: '',
        deliverables: '',
        campaignManagers: '',
        agreementTemplateId: '',
        postingStartDate: '',
        postingEndDate: '',
      });
      
      onClose();
    }
  };
  
  // Generate new agreement template
  const generateNewAgreement = useCallback(async (template) => {
    try {
      if (template) {
        const blob = await pdf(
          <AgreementTemplate
            DATE={dayjs().format('LL')}
            ccEmail="hello@cultcreative.com"
            ccPhoneNumber="+60162678757"
            NOW_DATE={dayjs().format('LL')}
            VERSION_NUMBER="V1"
            ADMIN_IC_NUMBER={template?.adminICNumber ?? 'Default'}
            ADMIN_NAME={template?.adminName ?? 'Default'}
            SIGNATURE={template?.signURL ?? 'Default'}
          />
        ).toBlob();
        return blob;
      }
      return null;
    } catch (err) {
      console.log(err);
      return err;
    }
  }, []);

  // Handle template selection
  const onSelectAgreement = async (template) => {
    const newAgreement = await generateNewAgreement(template);
    setDisplayPdf(newAgreement);
    setSelectedTemplate(template);
    setAgreementTemplateId(template.id);
    setErrors((prev) => ({ ...prev, agreementTemplateId: '' }));
    templateModal.onFalse();
  };

  // Campaign type and deliverable options
  const campaignTypeOptions = [
    { value: 'normal', label: 'UGC (With Posting)' },
    { value: 'ugc', label: 'UGC (No Posting)' },
  ];
  
  const deliverableOptions = [
    { value: 'PHOTOS', label: 'Photos' },
    { value: 'RAW_FOOTAGES', label: 'Raw Footage' },
    { value: 'WITHOUT_RAW_PHOTOS', label: 'Without Raw Footage and Photos' },
  ];
  
  const renderStepContent = () => {
    // Show the full multi-step process for all users
    switch (currentStep) {
      case 1: // CS Admin Assignment
        // For admin/CSM users completing activation, show a message that admin is already assigned
        if ((isCSM || user?.role === 'admin') && campaignDetails?.status === 'PENDING_ADMIN_ACTIVATION') {
          return (
            <Box sx={{ py: 2 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: 4, 
                  fontFamily: 'Instrument Serif',
                  textAlign: 'left',
                  fontWeight: 100
                }}
              >
                Admin Already Assigned
              </Typography>
              
              <Paper 
                variant="outlined" 
                sx={{ p: 3, borderRadius: 1, bgcolor: '#E8F5E9' }}
              >
                <Typography variant="body1" color="success.dark" sx={{ mb: 2 }}>
                  The campaign has already been assigned to an admin/CSM. You can proceed to complete the setup.
                </Typography>
                
                {campaignDetails?.campaignAdmin && campaignDetails.campaignAdmin.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Assigned to: {campaignDetails.campaignAdmin.map(admin => 
                      admin.admin?.user?.name || admin.adminId
                    ).join(', ')}
                  </Typography>
                )}
              </Paper>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => setCurrentStep(2)}
                  sx={{ 
                    borderRadius: '8px',
                    backgroundColor: '#1340ff',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 36,
                    minWidth: 80,
                    boxShadow: '0px -3px 0px 0px #102387 inset',
                    '&:hover': {
                      backgroundColor: '#1935dd',
                    },
                  }}
                >
                  Continue to Agreement Form
                </Button>
              </Box>
            </Box>
          );
        }
        
        // For superadmin/CSL users, show the normal admin assignment form
        return (
          <Box sx={{ py: 2 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 4, 
                fontFamily: 'Instrument Serif',
                textAlign: 'left'
              }}
            >
              Choose CS admin(s) to assign
            </Typography>
            
            {adminOptions.length === 0 && (
              <Box sx={{ mb: 3 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 2, borderRadius: 1, bgcolor: '#FFF9C4' }}
                >
                  <Typography variant="body1" color="warning.dark">
                    No CSM admins found in the system. Please create an admin with the CSM role first.
                  </Typography>
                </Paper>
              </Box>
            )}
            
            <FormControl fullWidth error={!!errors.campaignManagers} sx={{ mb: 4 }}>
              <InputLabel>CS Admins</InputLabel>
              <Select
                multiple
                value={campaignManagers}
                onChange={handleAdminManagerChange}
                input={<OutlinedInput label="CS Admins" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const admin = adminOptions.find(a => a.userId === value);
                      return (
                        <Chip 
                          key={value} 
                          label={admin?.user?.name || value} 
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {adminOptions.length > 0 ? (
                  adminOptions.map((admin) => (
                    <MenuItem key={admin.id} value={admin.userId}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {admin.user?.photoURL ? (
                          <Avatar 
                            src={admin.user.photoURL} 
                            alt={admin.user?.name}
                            sx={{ width: 32, height: 32 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {admin.user?.name?.charAt(0) || 'A'}
                          </Avatar>
                        )}
                        <Typography>{admin.user?.name || admin.id}</Typography>
                        {admin.role?.name && (
                          <Chip 
                            label={admin.role.name} 
                            size="small"
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No CSM admins available</MenuItem>
                )}
              </Select>
              {errors.campaignManagers && (
                <FormHelperText>{errors.campaignManagers}</FormHelperText>
              )}
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setCurrentStep(2)}
                disabled={campaignManagers.length === 0}
                sx={{ 
                  borderRadius: '8px',
                  backgroundColor: '#1340ff',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  minWidth: 80,
                  boxShadow: '0px -3px 0px 0px #102387 inset',
                  '&:hover': {
                    backgroundColor: '#1935dd',
                  },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
        
      case 2: // Agreement Form
        return (
          <Box sx={{ py: 2 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                mb: 4, 
                fontFamily: 'Instrument Serif',
                textAlign: 'left',
                fontWeight: 100
              }}
            >
              Agreement Form
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              {user?.agreementTemplate?.length < 1 ? (
                <Stack spacing={3} alignItems="flex-start">
                  <Paper 
                    variant="outlined" 
                    sx={{ p: 2, borderRadius: 1, width: '100%', bgcolor: '#FFF9C4' }}
                  >
                    <Typography variant="body1" color="warning.dark">
                      No agreement templates found. Please create a new template.
                    </Typography>
                  </Paper>
                  <Button
                    size="large"
                    variant="contained"
                    onClick={pdfModal.onTrue}
                    startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
                  >
                    Create New Template
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={3} alignItems="flex-start">
                  <Paper 
                    variant="outlined" 
                    sx={{ p: 2, borderRadius: 1, width: '100%', bgcolor: '#E8F5E9' }}
                  >
                    <Typography variant="body1" color="success.dark">
                      {user?.agreementTemplate?.length} templates found
                    </Typography>
                  </Paper>
                  
                  <Stack direction="row" spacing={2}>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={pdfModal.onTrue}
                      startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
                    >
                      Create New Template
                    </Button>
                    <Button
                      size="large"
                      variant="contained"
                      onClick={templateModal.onTrue}
                      startIcon={<Iconify icon="mdi:file-document-outline" width={20} />}
                    >
                      Select Template
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>
            
            {selectedTemplate && (
              <Box sx={{ mt: 4, mb: 2 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ p: 3, borderRadius: 1, bgcolor: '#F5F5F5' }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Iconify icon="mdi:file-document-outline" width={40} height={40} color="primary.main" />
                    <Stack>
                      <Typography variant="h6">{selectedTemplate.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Selected template will be used for this campaign
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep(1)}
                sx={{ 
                  borderRadius: '8px',
                  border: '1px solid #E7E7E7',
                  backgroundColor: '#FFFFFF',
                  color: '#666',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  minWidth: 80,
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  '&:hover': {
                    backgroundColor: '#F8F9FA',
                  },
                }}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={() => setCurrentStep(3)}
                disabled={!agreementTemplateId}
                sx={{ 
                  borderRadius: '8px',
                  backgroundColor: '#1340ff',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  minWidth: 80,
                  boxShadow: '0px -3px 0px 0px #102387 inset',
                  '&:hover': {
                    backgroundColor: '#1935dd',
                  },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
        
      case 3: // Campaign Type
        return (
          <Box display="flex" flexDirection="column" gap={2} py={2}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontFamily: 'Instrument Serif',
                textAlign: 'left',
                fontWeight: 100
              }}
            >
              Select Campaign Type
            </Typography>

            <Divider sx={{ mb: 1.5 }}/>
            
            <FormControl fullWidth error={!!errors.campaignType} sx={{ mb: 4 }}>
              <InputLabel>Campaign Type</InputLabel>
              <Select
                value={campaignType}
                onChange={(e) => {
                  setCampaignType(e.target.value);
                  setErrors((prev) => ({ ...prev, campaignType: '' }));
                }}
                label="Campaign Type"
              >
                {campaignTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.campaignType && (
                <FormHelperText>{errors.campaignType}</FormHelperText>
              )}
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep(2)}
                sx={{ 
                  borderRadius: '8px',
                  border: '1px solid #E7E7E7',
                  backgroundColor: '#FFFFFF',
                  color: '#666',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  minWidth: 80,
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  '&:hover': {
                    backgroundColor: '#F8F9FA',
                  },
                }}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={() => setCurrentStep(4)}
                disabled={!campaignType}
                sx={{ 
                  borderRadius: '8px',
                  backgroundColor: '#1340ff',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  height: 36,
                  minWidth: 80,
                  boxShadow: '0px -3px 0px 0px #102387 inset',
                  '&:hover': {
                    backgroundColor: '#1935dd',
                  },
                }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
        
      case 4: // Campaign Deliverables
        return (
          <FormProvider {...deliverablesForm}>
            <Box display="flex" flexDirection="column" gap={2} py={2}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  textAlign: 'left',
                fontWeight: 100
                }}
              >
                Select Campaign Deliverables
              </Typography>
              
              <Divider sx={{ mb: 1 }}/>

              <FormControl fullWidth error={!!errors.deliverables}>
                <RHFMultiSelect
                  name="deliverables"
                  options={deliverableOptions}
                  chip
                  checkbox
                  placeholder="Select deliverables"
                  helperText={errors.deliverables}
                  showClearAll
                  // react-hook-form will handle value/onChange
                  onChange={(val) => handleDeliverableChange(val)}
                />
              </FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentStep(3)}
                  sx={{ 
                    borderRadius: '8px',
                    border: '1px solid #E7E7E7',
                    backgroundColor: '#FFFFFF',
                    color: '#666',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 36,
                    minWidth: 80,
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    '&:hover': {
                      backgroundColor: '#F8F9FA',
                    },
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    // If campaign type is 'normal' (With Posting), go to posting dates step
                    // Otherwise, activate directly
                    if (campaignType === 'normal') {
                      setCurrentStep(5);
                    } else {
                      handleActivate();
                    }
                  }}
                  disabled={!deliverablesWatch || deliverablesWatch.length === 0 || (campaignType !== 'normal' && submitting)}
                  sx={{ 
                    borderRadius: '8px',
                    backgroundColor: '#1340ff',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 36,
                    minWidth: campaignType === 'normal' ? 80 : 140,
                    boxShadow: '0px -3px 0px 0px #102387 inset',
                    '&:hover': {
                      backgroundColor: '#1935dd',
                    },
                  }}
                >
                  {(() => {
                    if (campaignType === 'normal') return 'Next';
                    if (submitting) return <CircularProgress size={20} />;
                    return 'Activate Campaign';
                  })()}
                </Button>
              </Box>
            </Box>
          </FormProvider>
        );
        
      case 5: // Posting Dates
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box display="flex" flexDirection="column" gap={2} py={2}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontFamily: 'Instrument Serif',
                  fontWeight: 100,
                  textAlign: 'left'
                }}
              >
                Set Creator Posting Period
              </Typography>

              <Divider sx={{ mb: 0.5 }}/>
              
              <Typography variant='subtitle2' color="text.secondary" mb={-1}>Campaign Posting Period</Typography>

              <Stack spacing={1} direction="row" alignItems="center">
                <DatePicker
                  value={postingStartDate}
                  onChange={(newValue) => {
                    setPostingStartDate(newValue);
                    setErrors((prev) => ({ ...prev, postingStartDate: '' }));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.postingStartDate,
                      helperText: errors.postingStartDate,
                    },
                  }}
                />
                <Typography>-</Typography>
                <DatePicker
                  value={postingEndDate}
                  onChange={(newValue) => {
                    setPostingEndDate(newValue);
                    setErrors((prev) => ({ ...prev, postingEndDate: '' }));
                  }}
                  minDate={postingStartDate || undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.postingEndDate,
                      helperText: errors.postingEndDate,
                    },
                  }}
                />
              </Stack>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentStep(4)}
                  sx={{ 
                    borderRadius: '8px',
                    border: '1px solid #E7E7E7',
                    backgroundColor: '#FFFFFF',
                    color: '#666',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 36,
                    minWidth: 80,
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    '&:hover': {
                      backgroundColor: '#F8F9FA',
                    },
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleActivate}
                  disabled={!postingStartDate || !postingEndDate || submitting}
                  sx={{ 
                    borderRadius: '8px',
                    backgroundColor: '#1340ff',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    height: 36,
                    minWidth: 140,
                    boxShadow: '0px -3px 0px 0px #102387 inset',
                    '&:hover': {
                      backgroundColor: '#1935dd',
                    },
                  }}
                >
                  {submitting ? <CircularProgress size={20} /> : 'Activate Campaign'}
                </Button>
              </Box>
            </Box>
          </LocalizationProvider>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth={currentStep > 2 ? 'sm' : 'md'}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
          position: 'relative',
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <Iconify icon="eva:close-fill" width={30} />
      </IconButton>
      
      <DialogContent sx={{ py: 3, px: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent()
        )}
      </DialogContent>

      {/* Template Selection Dialog */}
      <Dialog open={templateModal.value} fullWidth maxWidth="md" onClose={templateModal.onFalse}>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontFamily: 'Instrument Serif', mb: 1 }}>
            Select Agreement Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose one template to use for this campaign
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              },
              gap: 2,
              justifyItems: 'center',
              alignItems: 'center',
              py: 2,
            }}
          >
            {user?.agreementTemplate?.length > 0 &&
              user?.agreementTemplate?.map((template) => (
                <Box
                  key={template?.id}
                  sx={{
                    border: selectedTemplate?.id === template?.id ? '3px solid #1340ff' : '1px solid #e0e0e0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    position: 'relative',
                    height: 400,
                    width: '100%',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                    },
                  }}
                  onClick={() => onSelectAgreement(template)}
                >
                  <Radio
                    checked={selectedTemplate?.id === template?.id}
                    onChange={() => onSelectAgreement(template)}
                    value={template?.id}
                    name="template-selection"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 100,
                    }}
                  />

                  <Box sx={{ width: '100%', height: '100%', overflow: 'auto', scrollbarWidth: 'none' }}>
                    <Document
                      file={template?.url}
                      onLoadSuccess={({ numPages }) => setPages(numPages)}
                    >
                      <Stack spacing={1}>
                        {Array.from({ length: pages }, (_, index) => (
                          <Page
                            key={index}
                            pageIndex={index}
                            renderTextLayer={false}
                            pageNumber={index + 1}
                            scale={1}
                            width={lgUp ? 400 : 300}
                          />
                        ))}
                      </Stack>
                    </Document>
                  </Box>
                </Box>
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={templateModal.onFalse}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* PDF Editor Modal for creating new templates */}
      <PDFEditorModal
        open={pdfModal.value}
        onClose={() => {
          pdfModal.onFalse();
          // Refresh templates after creating a new one
          axios.get('/api/campaign/template')
            .then((response) => {
              if (response.data) {
                setAgreementTemplates(response.data);
              }
            })
            .catch((error) => {
              console.error('Error fetching agreement templates:', error);
            });
        }}
        user={user}
        campaignId={campaignId}
        setAgreementForm={(field, value) => {
          if (field === 'agreementFrom' && value) {
            setSelectedTemplate(value);
            setAgreementTemplateId(value.id);
            setErrors((prev) => ({ ...prev, agreementTemplateId: '' }));
          }
        }}
      />
    </Dialog>
  );
}

ActivateCampaignDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaignId: PropTypes.string,
  onSuccess: PropTypes.func,
}; 