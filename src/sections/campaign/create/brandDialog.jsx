import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useCompany } from 'src/hooks/zustands/useCompany';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify/iconify';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import CreateCompany from './companyDialog';

const intersList = [
  'Art',
  'Beauty',
  'Business',
  'Fashion',
  'Fitness',
  'Food',
  'Gaming',
  'Health',
  'Lifestyle',
  'Music',
  'Sports',
  'Technology',
  'Travel',
];
export default function CreateBrand({ setBrand, open, onClose }) {
  const [openCompany, setOpenCompany] = useState(false);
  const [companyState, setCompanyState] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const { company } = useCompany();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Must be a valid email').required('Email is required'),
    phone: Yup.string().required('Phone is required'),
    registration_number: Yup.string().required('Registration Number is required'),
    address: Yup.string().required('Address is required'),
    companyChoice: Yup.string().required('Company is required'),
    brandInstagram: Yup.string().required('Brand Instagram is required'),
    brandTiktok: Yup.string().required('Brand Tiktok is required'),
    brandFacebook: Yup.string().required('Brand Facebook is required'),
    brandIntersts: Yup.array().min(3, 'Brand Interests is required'),
    brandIndustries: Yup.array().min(3, 'Brand Industries is required'),
  });
  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    registration_number: '',
    address: '',
    companyChoice: '',
    brandInstagram: '',
    brandTiktok: '',
    brandFacebook: '',
    brandIntersts: [],
    brandIndustries: [],
  };

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.post(endpoints.company.createOneBrand, data);
      reset();
      onClose();
      setBrand(data.name);
      enqueueSnackbar('Brand created successfully', { variant: 'success' });
      console.log(res.status);
    } catch (error) {
      console.log(error);
    }
  });

  console.log(companyState);
  useEffect(() => {
    if (companyState !== '') {
      setValue('companyChoice', companyState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
      fullWidth
    >
      <DialogTitle>Create Brand</DialogTitle>
      <DialogContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box
            rowGap={2}
            columnGap={3}
            display="grid"
            mt={4}
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField name="name" label="Name" fullWidth />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignContent: 'center',
              }}
            >
              {' '}

              <RHFAutocomplete
              fullWidth
                key="companyChoice"
                name="companyChoice"
                placeholder="Company"
                options={companyState ? [companyState] : company?.map((option) => option.name)}
              />
              {/* <RHFSelect name="companyChoice" label="Company">
                {companyState ? (
                  <MenuItem value={companyState}>{companyState}</MenuItem>
                ) : (
                  company?.map((option) => (
                    <MenuItem key={option.name} value={option.name}>
                      {option.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect> */}
              {/* <Box> */}
              <Box
                sx={{
                  alignContent: 'center',
                }}
              >
                <IconButton
                  sx={{
                    mx: 1,
                    bgcolor: 'whitesmoke',
                  }}
                  onClick={handleClick}
                >
                  <Iconify icon="mingcute:add-line" />
                </IconButton>
                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setOpenCompany(true);
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Iconify icon="mdi:invite" />
                      <Typography variant="button">Create Company</Typography>
                    </Stack>
                  </MenuItem>
                </Menu>
              </Box>
              {/* <Button
                  variant="contained"
                  sx={{
                    width: '90%',
                    height: '90%',
                    mx: 1,
                  }}
                  onClick={() => {
                    setOpenCompany(true);
                  }}
                >
                  Create Company
                </Button> */}
              {/* </Box> */}
            </Box>
            <RHFTextField name="email" label="Email" fullWidth />
            <RHFTextField name="phone" label="Phone" />
            <RHFTextField name="registration_number" label="Registration Number" fullWidth />
            <RHFTextField name="address" label="Address" />
            <RHFTextField key="brandInstagram" name="brandInstagram" label="Brand Instagram" />
            <RHFTextField key="brandTiktok" name="brandTiktok" label="Brand Tiktok" />
            <RHFTextField key="brandFacebook" name="brandFacebook" label="Brand Facebook" />
            <RHFAutocomplete
              key="brandIntersts"
              name="brandIntersts"
              placeholder="+ Brand Interests"
              multiple
              freeSolo="true"
              disableCloseOnSelect
              options={intersList.map((option) => option)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
            <RHFAutocomplete
              key="brandIndustries"
              name="brandIndustries"
              placeholder="+ Brand Industries"
              multiple
              freeSolo="true"
              disableCloseOnSelect
              options={intersList.map((option) => option)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
          </Box>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              loadingPosition="start"
              color="primary"
            >
              Create
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </DialogContent>
      <CreateCompany
        open={openCompany}
        onClose={() => {
          setOpenCompany(false);
        }}
        setCompany={setCompanyState}
      />
    </Dialog>
  );
}

CreateBrand.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  setBrand: PropTypes.func,
};
