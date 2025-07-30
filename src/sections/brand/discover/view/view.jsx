/* eslint-disable no-unused-vars */
import * as Yup from 'yup';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { LoadingButton } from '@mui/lab';
import Container from '@mui/material/Container';
import {
  Box,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetCompany from 'src/hooks/use-get-company';

import axiosInstance, { endpoints } from 'src/utils/axios';

import withPermission from 'src/auth/guard/withPermissions';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import BrandLists from '../brand-lists';

const defaultFilters = {
  roles: [],
  locations: [],
  benefits: [],
  experience: 'all',
  employmentTypes: [],
};

const emailSchema = Yup.string().email().required();

function DiscoverBrand() {
  const settings = useSettingsContext();
  const router = useRouter();

  const { data: companies, isLoading, mutate } = useGetCompany();

  const [email, setEmail] = useState();

  const [search, setSearch] = useState('');

  const clientDialog = useBoolean();
  const isSubmitting = useBoolean();

  const filteredData =
    !isLoading && companies
      ? companies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase()))
      : [];

  const onChange = (value) => {
    setEmail(value);
  };

  const onSubmit = async () => {
    if (!email) {
      toast.error('Please fill in all details');
      return;
    }

    if (!emailSchema.isValidSync(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    isSubmitting.onTrue();
    try {
      const res = await axiosInstance.post(endpoints.client.invite, { email });
      toast.success(res?.data?.message);
      mutate();
      clientDialog.onFalse();
      setEmail();
    } catch (error) {
      console.log(error);
      toast.error('error');
    } finally {
      isSubmitting.onFalse();
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Client List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Brand',
            href: paths.dashboard.root,
          },
          { name: 'List' },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="qlementine-icons:new-16" width={18} />}
            onClick={() => clientDialog.onTrue()}
            sx={{
              borderColor: '#EBEBEB',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            }}
          >
            New client
          </Button>
        }
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {!isLoading && (
        <>
          {!companies || companies.length < 1 ? (
            <Box mt={2}>
              <EmptyContent
                filled
                title="No Data"
                sx={{
                  py: 10,
                }}
              />
            </Box>
          ) : (
            <BrandLists dataFiltered={filteredData} />
          )}
        </>
      )}

      <Dialog
        open={clientDialog.value}
        PaperProps={{
          sx: {
            borderRadius: 0.5,
            padding: 2,
          },
        }}
        maxWidth="xs"
        fullWidth
      >
        <Typography variant="subtitle1">Invite New Client</Typography>
        <DialogContent sx={{ p: 0, mt: 2 }}>
          <TextField
            name="role"
            value={email}
            size="email"
            type="email"
            placeholder="Eg. ***@cultcreative.asia"
            fullWidth
            onChange={(e) => onChange(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 0, mt: 5 }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ borderRadius: 0.5 }}
            onClick={() => {
              setEmail();
              clientDialog.onFalse();
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            size="small"
            variant="contained"
            sx={{ borderRadius: 0.5 }}
            onClick={onSubmit}
            loading={isSubmitting.value}
          >
            Invite
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// export default DiscoverBrand;
export default withPermission(['list:client'], DiscoverBrand);
