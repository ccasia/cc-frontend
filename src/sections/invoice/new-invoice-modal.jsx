import PropTypes from 'prop-types';
import { useState, useEffect, useMemo, useRef } from 'react';

// axios
import axiosInstance, { endpoints } from 'src/utils/axios';

// @mui
import Avatar from '@mui/material/Avatar';

// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';

// hooks
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

// components
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function NewInvoiceModal({ open, onClose, onSubmit, campId }) {
  console.log('Modal received campId:', campId);
  const [creator, setCreator] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [service, setService] = useState([]);
  const [otherService, setOtherService] = useState('');
  const [currency, setCurrency] = useState('MYR');
  
  // Currency symbol mapping
  const currencySymbols = {
    MYR: 'RM',
    SGD: 'S$',
    USD: '$',
    AUD: 'A$',
    JPY: '¥',
    IDR: 'Rp',
  };
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch agreements data
  const { data: agreementsData, isLoading } = useGetAgreements(campId);
  
  console.log('Raw Agreement Data:', agreementsData);
  
  // Filter creators with approved agreements
  const approvedCreators = useMemo(() => {
    if (!agreementsData || !Array.isArray(agreementsData)) return [];
    
    // Log the structure of the first agreement to understand its format
    if (agreementsData.length > 0) {
      console.log('First Agreement Structure:', JSON.stringify(agreementsData[0], null, 2));
    }
    
    const filtered = agreementsData
      // First, log all agreements to see their structure
      .map((agreement, index) => {
        console.log(`Agreement ${index}:`, agreement);
        return agreement;
      })
      // Then filter for approved agreements
      .filter(agreement => {
        // More flexible check for approved status
        const status = agreement.status || '';
        const isStatusApproved = status.toUpperCase().includes('APPROVE');
        
        // Check submissions array if it exists
        const hasApprovedSubmission = agreement.submissions?.some(sub => {
          const subStatus = sub.status || '';
          return (sub.type === 'AGREEMENT_FORM' || sub.type === 'agreement_form') && 
                 subStatus.toUpperCase().includes('APPROVE');
        }) || false;
        
        // Check if the agreement has any approved field
        const hasApprovedField = Object.entries(agreement).some(([key, value]) => 
          typeof value === 'string' && 
          key.toLowerCase().includes('status') && 
          value.toUpperCase().includes('APPROVE')
        );
        
        const isApproved = isStatusApproved || hasApprovedSubmission || hasApprovedField;
        console.log('Agreement ID:', agreement.id, 'Status:', status, 'Is Approved:', isApproved);
        return isApproved;
      })
      // Map to creator objects
      .map(agreement => {
        // Try to extract user information from various possible locations
        const user = agreement.user || {};
        const userId = user.id || agreement.userId || agreement.creatorId || '';
        const userName = user.name || user.fullName || agreement.creatorName || 'Unknown Creator';
        const userEmail = user.email || '';
        const userAvatar = user.avatarUrl || user.profilePicture || '';
        
        console.log('Approved Agreement User:', user, 'User ID:', userId, 'Name:', userName);
        
        return {
          id: userId,
          name: userName,
          email: userEmail,
          avatarUrl: userAvatar,
          currency: user.shortlisted?.[0]?.currency || agreement.currency || 'MYR'
        };
      });
    
    console.log('Filtered Approved Creators:', filtered);
    
    // If no approved creators are found, extract all creators as a fallback
    if (filtered.length === 0) {
      console.log('No approved creators found, showing all creators as fallback');
      return agreementsData.map(agreement => {
        const user = agreement.user || {};
        const userId = user.id || agreement.userId || agreement.creatorId || '';
        const userName = user.name || user.fullName || agreement.creatorName || 'Unknown Creator';
        const userEmail = user.email || '';
        const userAvatar = user.avatarUrl || user.profilePicture || '';
        
        return {
          id: userId,
          name: userName,
          email: userEmail,
          avatarUrl: userAvatar,
          currency: user.shortlisted?.[0]?.currency || agreement.currency || 'MYR'
        };
      });
    }
    
    return filtered;
  }, [agreementsData]);
  
  // Filter creators based on search term
  const filteredCreators = useMemo(() => {
    if (!searchTerm) return approvedCreators;
    
    return approvedCreators.filter(creator => 
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [approvedCreators, searchTerm]);
  
  // Custom dropdown component for creators
  const CreatorDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [searchInput, setSearchInput] = useState('');
    
    // Always show dropdown when typing
    useEffect(() => {
      if (searchInput) {
        setIsOpen(true);
      }
    }, [searchInput]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    // Filter creators based on search input
    const searchFilteredCreators = useMemo(() => {
      if (!searchInput) return approvedCreators;
      
      const lowerCaseSearch = searchInput.toLowerCase();
      return approvedCreators.filter(c => 
        c.name.toLowerCase().includes(lowerCaseSearch) ||
        c.email.toLowerCase().includes(lowerCaseSearch)
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);
    
    const selectedCreator = approvedCreators.find(c => c.id === creatorId);
    
    return (
      <Box ref={dropdownRef} sx={{ position: 'relative', width: '100%' }}>
        {/* Search input */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 48,
            px: 2,
            backgroundColor: '#FFFFFF',
            border: '1px solid',
            borderColor: isOpen ? '#1340FF' : '#E0E0E0',
            borderRadius: 2,
            cursor: 'text',
            '&:hover': {
              borderColor: '#C4CDD5',
            },
          }}
        >
          <InputAdornment position="start" sx={{ mr: 1 }}>
            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
          </InputAdornment>
          
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={selectedCreator ? selectedCreator.name : "Search creator"}
            onClick={() => setIsOpen(true)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              background: 'transparent',
              fontSize: '14px',
            }}
            autoComplete="off"
          />
          
          <Box
            onClick={() => setIsOpen(!isOpen)}
            sx={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Box>
        </Box>
        
        {/* Dropdown menu */}
        {isOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              zIndex: 1300,
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {searchFilteredCreators.length > 0 ? (
              searchFilteredCreators.map((creatorItem) => (
                <Box
                  key={creatorItem.id}
                  onClick={() => {
                    setCreatorId(creatorItem.id);
                    setSearchInput(creatorItem.name); // Set search input to selected creator name
                    setIsOpen(false);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <Avatar
                    src={creatorItem.avatarUrl}
                    alt={creatorItem.name}
                    sx={{ width: 36, height: 36, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      {creatorItem.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {creatorItem.email}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {isLoading ? 'Loading creators...' : 'No creators found'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };
  
  // Update currency when creator changes
  useEffect(() => {
    if (creatorId) {
      const selectedCreator = approvedCreators.find(c => c.id === creatorId);
      if (selectedCreator) {
        setCurrency(selectedCreator.currency);
        setCreator(selectedCreator.name);
      }
    }
  }, [creatorId, approvedCreators]);

  // Function to fetch creator payment details
  const fetchCreatorPaymentDetails = async (selectedCreatorId) => {
    try {
      // Use the getCreatorFullInfo endpoint to get complete creator details
      const response = await axiosInstance.get(endpoints.creator.getCreatorFullInfo(selectedCreatorId));
      console.log('Creator full info response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching creator payment details:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Find the complete creator object
    const selectedCreatorObj = approvedCreators.find(c => c.id === creatorId);
    console.log('Selected creator object for submission:', selectedCreatorObj);
    
    // Get the complete agreement data for this creator
    const creatorAgreement = agreementsData?.find(agreement => 
      agreement?.user?.id === creatorId || 
      agreement?.userId === creatorId ||
      agreement?.creatorId === creatorId
    );
    console.log('Creator agreement data:', creatorAgreement);
    
    // Fetch detailed creator information including payment details
    const creatorDetails = await fetchCreatorPaymentDetails(creatorId);
    console.log('Creator details with payment info:', creatorDetails);
    
    onSubmit({
      creator,
      creatorId,
      service: service.includes('Other') ? [...service, otherService] : service,
      currency,
      amount,
      // Pass the complete creator data
      creatorData: selectedCreatorObj,
      // Pass the complete agreement data
      agreementData: creatorAgreement,
      // Pass the detailed creator information
      creatorDetails,
    });
    handleClose();
  };

  const handleClose = () => {
    setCreator('');
    setCreatorId('');
    setService([]);
    setOtherService('');
    setCurrency('MYR');
    setAmount('');
    setSearchTerm('');
    onClose();
  };

  // Common input field styling - without background color
  const inputStyle = {
    borderRadius: 1,
    height: 48,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#E0E0E0',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C4CDD5',
    },
  };
  
  // Custom dropdown arrow icon
  const DoubleArrowIcon = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6L8 10L12 6" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Box>
  );
  
  // Custom tick icon component
  const TickedIcon = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.834 6.25016L7.08398 10.8335L5.41732 9.16683M15.834 8.3335C15.834 12.4756 12.4761 15.8335 8.33398 15.8335C4.19185 15.8335 0.833984 12.4756 0.833984 8.3335C0.833984 4.19136 4.19185 0.833496 8.33398 0.833496C12.4761 0.833496 15.834 4.19136 15.834 8.3335Z" stroke="#1340FF" strokeWidth="1.66667" strokeLinecap="square"/>
      </svg>
    </Box>
  );
  
  // Custom dropdown component
  const CustomDropdown = ({ label, value, options, onChange, multiple = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    // For multiple selection, value is an array
    let selectedValues = [];
    if (multiple) {
      selectedValues = Array.isArray(value) ? value : [];
    } else {
      selectedValues = value ? [value] : [];
    }
    
    // Get display text for selected options
    const getSelectedText = () => {
      if (!multiple) {
        const selectedOption = options.find(option => option.value === value);
        return selectedOption ? selectedOption.label : 'Select an option';
      }
      
      if (selectedValues.length === 0) return 'Select options';
      
      // Get labels of selected options
      const selectedLabels = selectedValues.map(val => {
        const option = options.find(opt => opt.value === val);
        return option ? option.label : '';
      }).filter(lbl => lbl !== '');
      
      // Join with commas
      return selectedLabels.join(', ');
    };
    
    // No filtering, use all options
    const filteredOptions = options;
    
    // Handle selection change
    const handleSelect = (optionValue, event) => {
      // Prevent event bubbling to avoid triggering outside click
      if (event) {
        event.stopPropagation();
      }
      
      if (!multiple) {
        // For single selection, close dropdown after selecting
        onChange(optionValue);
        setIsOpen(false);
      } else {
        // For multiple selection, keep dropdown open
        const newValues = [...selectedValues];
        const index = newValues.indexOf(optionValue);
        
        if (index === -1) {
          // Add the value if not already selected
          newValues.push(optionValue);
        } else {
          // Remove the value if already selected
          newValues.splice(index, 1);
        }
        
        onChange(newValues);
        // Keep dropdown open - no need to close it
      }
    };
    
    return (
      <Box ref={dropdownRef} sx={{ position: 'relative', width: '100%' }}>
        {/* Dropdown trigger */}
        <Box
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            px: 2,
            backgroundColor: '#FFFFFF',
            border: '1px solid',
            borderColor: isOpen ? '#1340FF' : '#E0E0E0',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#C4CDD5',
            },
          }}
        >
          <Typography variant="body2">{getSelectedText()}</Typography>
          <Box
            sx={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Box>
        </Box>
        
        {/* Dropdown menu */}
        {isOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              zIndex: 1300, // Higher than the modal's z-index
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {/* No search input */}
            
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Box
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur event which closes dropdown
                    e.stopPropagation(); // Prevent event bubbling
                    handleSelect(option.value, e);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <Typography variant="body2">{option.label}</Typography>
                  {selectedValues.includes(option.value) && <TickedIcon />}
                </Box>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No options found
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };
  
  CustomDropdown.propTypes = {
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    multiple: PropTypes.bool,
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
      sx={{ '.MuiDialog-container': { overflow: 'visible' } }}
      PaperProps={{
        sx: {
          width: 794,
          minHeight: 434,
          maxHeight: '90vh',
          borderRadius: '20px',
          bgcolor: '#F4F4F4',
          boxShadow: '0px 1px 2px 0px #00000026',
          overflow: 'visible', // Allow dropdown menus to overflow outside the modal
        },
      }}
    >
      <DialogTitle sx={{ position: 'relative', pb: 0, pt: 3, px: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontFamily: 'Instrument Serif',
            fontWeight: 400,
            fontSize: '36px',
            lineHeight: '40px',
            letterSpacing: '0%',
            verticalAlign: 'middle',
            color: '#212B36',
            mb: 3
          }}
        >
          New Invoice
        </Typography>

        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
          }}
        >
          <Iconify icon="eva:close-fill" width={24} height={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, px: 3, overflow: 'visible' }}>
        <Stack spacing={2} sx={{ gap: '16px' }}>
          <Box>
            <Typography variant="body2" sx={{ 
              mb: 1, 
              fontFamily: 'InterDisplay',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0%',
              color: '#636366'
            }}>
              Select Creator
            </Typography>
            <CreatorDropdown />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontFamily: 'InterDisplay',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: '#636366'
              }}>
                Select Service
              </Typography>
              <Select
                multiple
                fullWidth
                value={service}
                onChange={(e) => setService(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <Typography sx={{ color: '#888888' }}>Select options</Typography>;
                  }
                  return selected.join(', ');
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
                sx={{
                  height: 48,
                  backgroundColor: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#C4CDD5',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1340FF',
                  },
                }}
              >
                {['Ads', 'Cross Posting', 'Reinbursement', 'Other'].map((option) => (
                  <MenuItem 
                    key={option} 
                    value={option}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      },
                    }}
                  >
                    <ListItemText 
                      primary={option === 'Other' ? 'Others' : option}
                      primaryTypographyProps={{
                        fontWeight: 400,
                        fontSize: '14px',
                      }}
                    />
                    {service.indexOf(option) > -1 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.834 6.25016L7.08398 10.8335L5.41732 9.16683M15.834 8.3335C15.834 12.4756 12.4761 15.8335 8.33398 15.8335C4.19185 15.8335 0.833984 12.4756 0.833984 8.3335C0.833984 4.19136 4.19185 0.833496 8.33398 0.833496C12.4761 0.833496 15.834 4.19136 15.834 8.3335Z" stroke="#1340FF" strokeWidth="1.66667" strokeLinecap="square"/>
                        </svg>
                      </Box>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontFamily: 'InterDisplay',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: '#636366'
              }}>
                Other
              </Typography>
              <TextField
                fullWidth
                disabled={!service.includes('Other')}
                placeholder="Please provide details if you selected 'Other'."
                value={otherService}
                onChange={(e) => setOtherService(e.target.value)}
                InputProps={{
                  sx: {
                    ...inputStyle,
                    backgroundColor: '#FFFFFF',
                  },
                }}
              />
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontFamily: 'InterDisplay',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: '#636366'
              }}>
                Currency
              </Typography>
              <CustomDropdown
                label="Select Currency"
                value={currency}
                options={[
                  { value: 'MYR', label: 'MYR' },
                  { value: 'SGD', label: 'SGD' },
                  { value: 'USD', label: 'USD' },
                  { value: 'AUD', label: 'AUD' },
                  { value: 'JPY', label: 'JPY' },
                  { value: 'IDR', label: 'IDR' }
                ]}
                onChange={(value) => setCurrency(value)}
              />
            </Box>

            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                fontFamily: 'InterDisplay',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: '#636366'
              }}>
                Payment Amount
              </Typography>
              <TextField
                fullWidth
                placeholder="0.00"
                type="text"
                inputProps={{
                  inputMode: 'decimal',
                }}
                value={amount}
                onChange={(e) => {
                  // Only allow numbers, one decimal point, and max 2 decimal places
                  const value = e.target.value;
                  const regex = /^\d*(\.\d{0,2})?$/;
                  if (value === '' || regex.test(value)) {
                    setAmount(value);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="body2" sx={{ color: amount ? 'text.primary' : 'text.disabled' }}>
                        {currencySymbols[currency] || ''}
                      </Typography>
                    </InputAdornment>
                  ),
                  sx: {
                    ...inputStyle,
                    backgroundColor: '#FFFFFF',
                  },
                }}
              />
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClose}
              sx={{
                width: 83,
                height: 44,
                pt: '10px',
                pr: '16px',
                pb: '13px',
                pl: '16px',
                gap: '6px',
                borderRadius: '8px',
                borderWidth: '1px',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                color: '#637381',
                '&:hover': {
                  bgcolor: '#F9FAFB',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                height: 44,
                minWidth: 180,
                pt: '10px',
                pr: '14px',
                pb: '13px',
                pl: '14px',
                gap: '4px',
                borderRadius: '8px',
                bgcolor: '#1340FF',
                boxShadow: '0px -3px 0px 0px #00000073 inset',
                color: 'white',
                '&:hover': {
                  bgcolor: '#0035DF'
                },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Generate and Send
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

NewInvoiceModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  campId: PropTypes.string,
};
