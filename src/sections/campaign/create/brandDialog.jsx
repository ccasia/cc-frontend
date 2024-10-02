import * as Yup from 'yup';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Stack, Avatar, ListItemText } from '@mui/material';

import useGetCompany from 'src/hooks/use-get-company';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify/iconify';
import FormProvider, { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import CreateCompany from './companyDialog';

const interestsLists = [
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
  // const { company, isLoading } = useCompany();
  const { data: company, isLoading } = useGetCompany();

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
    companyChoice: Yup.object().required('Company is required'),
    brandInstagram: Yup.string().required('Instagram is required'),
    brandTiktok: Yup.string().required('Tiktok is required'),
    brandFacebook: Yup.string().required('Facebook is required'),
    brandIndustries: Yup.array()
      .min(1, 'At least one Brand Interests is required')
      .max(3, 'Maximum of three Brand Interests is required')
      .required('BrandIndustries is required'),
  });

  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    companyChoice: {},
    brandInstagram: '',
    brandTiktok: '',
    brandFacebook: '',
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
      console.log(res.data);
      reset();
      onClose();
      mutate(endpoints.company.getOptions);
      setBrand('campaignBrand', res?.data?.brand);
      enqueueSnackbar('Brand created successfully', { variant: 'success' });
      console.log(res.status);
    } catch (error) {
      console.log(error);
    }
  });

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
      <DialogTitle>Create Client</DialogTitle>
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
              {!isLoading && (
                <RHFAutocomplete
                  fullWidth
                  key="companyChoice"
                  name="companyChoice"
                  placeholder="Company"
                  options={companyState ? [companyState] : company}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => {
                    // eslint-disable-next-line react/prop-types
                    const { key, ...optionProps } = props;

                    if (!option.id) {
                      return null;
                    }

                    return (
                      <Stack
                        component="li"
                        key={key}
                        direction="row"
                        spacing={1}
                        p={1}
                        {...optionProps}
                      >
                        <Avatar src={option?.logo} sx={{ width: 35, height: 35 }} />
                        <ListItemText primary={option.name} />
                      </Stack>
                    );
                  }}
                />
              )}

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
            <RHFTextField key="brandInstagram" name="brandInstagram" label="Instagram" />
            <RHFTextField key="brandTiktok" name="brandTiktok" label="Tiktok" />
            <RHFTextField key="brandFacebook" name="brandFacebook" label="Facebook" />

            <RHFAutocomplete
              key="brandIndustries"
              name="brandIndustries"
              placeholder="+ Brand Industries"
              multiple
              freeSolo
              disableCloseOnSelect
              options={interestsLists.map((option) => option)}
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
              startIcon
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
