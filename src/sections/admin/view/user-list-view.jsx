import * as yup from 'yup';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { Toaster } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import {
  Step,
  Stack,
  Dialog,
  Stepper,
  MenuItem,
  StepLabel,
  Typography,
  DialogTitle,
  StepContent,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetRoles from 'src/hooks/use-get-roles';
import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

// eslint-disable-next-line import/no-cycle
import UserTableRow from '../user-table-row';
import UserTableToolbar from '../user-table-toolbar';
import AdminCreateManager from '../admin-create-form';
import UserTableFiltersResult from '../user-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

const TABLE_HEAD = [
  { id: 'name', label: 'Name', width: 180 },
  { id: 'phoneNumber', label: 'Phone Number', width: 220 },
  { id: 'designation', label: 'Designation', width: 180 },
  { id: 'country', label: 'Country', width: 100 },
  { id: 'mode', label: 'Mode', width: 100 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

export const MODULE_ITEMS = [
  {
    name: 'Manage Creator',
    items: ['view_creator', 'create_creator', 'edit_creator', 'delete_creator'],
    value: 'creator',
  },
  {
    name: 'Manage Campaign',
    items: ['view_campaign', 'create_campaign', 'edit_campaign', 'delete_campaign'],
    value: 'campaign',
  },
  {
    name: 'Manage Brand',
    items: ['view_brand', 'create_brand', 'edit_brand', 'delete_brand'],
    value: 'brand',
  },
  {
    name: 'Manage Metric',
    items: ['view_metric', 'create_metric', 'edit_metric', 'delete_metric'],
    value: 'metric',
  },
  {
    name: 'Manage Invoice',
    items: ['view_invoice', 'create_invoice', 'edit_invoice', 'delete_invoice'],
    value: 'invoice',
  },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
};

// ----------------------------------------------------------------------

export default function UserListView({ admins }) {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const { data: roles, isLoading } = useGetRoles();
  const { role } = useAuthContext();
  const buttonLoading = useBoolean();

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleClickOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const table = useTable();

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState(admins);

  const [filters, setFilters] = useState(defaultFilters);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered?.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered?.length && canReset) || !dataFiltered?.length;

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`${endpoints.admin.delete}/${id}`);
        const deleteRows = tableData.filter((row) => row.id !== id);
        setTableData(deleteRows);
        enqueueSnackbar('Successfully deleted admin');
      } catch (error) {
        enqueueSnackbar(error?.message, { variant: 'error' });
      }
    },
    [enqueueSnackbar, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    enqueueSnackbar('Delete success!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, enqueueSnackbar, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );

  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const schema = yup.object().shape({
    email: yup.string().email().required('Email is required'),
    role: yup.string().required('Role is required'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: '',
      email: '',
    },
  });

  const { handleSubmit, watch } = methods;

  const r = watch('role');

  const onSubmit = handleSubmit(async (data) => {
    try {
      buttonLoading.onTrue();
      await axiosInstance.post(endpoints.users.newAdmin, data);
      enqueueSnackbar('Link has been sent to admin!');
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      buttonLoading.onFalse();
    }
  });

  const inviteAdminDialog = (
    <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Invite Admin</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Role</StepLabel>
              <StepContent>
                <RHFSelect name="role" label="Role">
                  {!isLoading &&
                    roles.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                </RHFSelect>

                <Stack spacing={0.5} mt={1}>
                  {!isLoading &&
                    r &&
                    roles
                      .find((item) => item.id === r)
                      ?.permissions.map((permission) => (
                        <Typography variant="caption" color="text.secondary">
                          [{permission.name}] {'=>'} {permission.descriptions}
                        </Typography>
                      ))}
                </Stack>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={{
                    my: 2,
                  }}
                >
                  Next
                </Button>
              </StepContent>
            </Step>
            {/* <Step>
            <StepLabel>Permission</StepLabel>
            <StepContent>
              {fields.map((elem, index) => {
                const module = watch(`permission.${[index]}.module`);
                return (
                  <Box key={elem.id} display="flex" gap={2} my={2} alignItems="center">
                    <Controller
                      name={`permission.${index}.module`}
                      control={control}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          error={
                            errors.permission &&
                            errors.permission[index] &&
                            errors.permission[index].module
                          }
                        >
                          <InputLabel id="module">Module</InputLabel>
                          <Select labelId="module" label="Module" {...field}>
                            {MODULE_ITEMS.map((item, a) => (
                              <MenuItem value={item.value} key={a}>
                                {item.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />

                    <Controller
                      name={`permission.${index}.permissions`}
                      control={control}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          error={
                            errors.permission &&
                            errors.permission[index] &&
                            errors.permission[index].permissions
                          }
                        >
                          <InputLabel id="permission">Permission</InputLabel>
                          <Select
                            labelId="permission"
                            label="Permission"
                            {...field}
                            required
                            multiple
                          >
                            {MODULE_ITEMS.find((item) => item.value === module)?.items.map(
                              (val, i) => (
                                <MenuItem key={i} value={val}>
                                  {val}
                                </MenuItem>
                              )
                            )}
                          </Select>
                        </FormControl>
                      )}
                    />
                    <IconButton color="error" onClick={() => remove(index)}>
                      <Iconify icon="mdi:trash" />
                    </IconButton>
                  </Box>
                );
              })}

              {fields.length < 5 && (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => append({ module: '', permissions: [] })}
                  sx={{
                    my: 2,
                  }}
                >
                  + Add New Role
                </Button>
              )}
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{
                    my: 2,
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={{
                    my: 2,
                  }}
                >
                  Next
                </Button>
              </Stack>
            </StepContent>
          </Step> */}
            <Step>
              <StepLabel>Email</StepLabel>
              <StepContent>
                <RHFTextField name="email" type="email" label="Email" />
                {/* <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      margin="dense"
                      label="Email Address"
                      type="email"
                      fullWidth
                      variant="outlined"
                      error={errors.email}
                    />
                  )}
                /> */}
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleBack}
                  sx={{
                    my: 2,
                  }}
                >
                  Back
                </Button>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              handleCloseDialog();
            }}
          >
            Cancel
          </Button>
          <LoadingButton type="submit" loading={buttonLoading.value}>
            Invite
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  useEffect(() => {
    setTableData(admins && admins.filter((admin) => admin?.id !== user?.id));
  }, [admins, user]);

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="List Admins"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Admin' },
            { name: 'List' },
          ]}
          action={
            role?.name !== 'CSM' && (
              <Button
                variant="contained"
                size="small"
                onClick={handleClickOpenDialog}
                startIcon={<Iconify icon="mdi:invite" width={18} />}
              >
                Invite admin
              </Button>
            )
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        {inviteAdminDialog}

        <AdminCreateManager open={openCreateDialog} onClose={handleCloseCreateDialog} />

        <Card>
          <Tabs
            value={filters.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.status) && 'filled') || 'soft'
                    }
                    color={
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'banned' && 'error') ||
                      'default'
                    }
                  >
                    {['active', 'pending', 'banned', 'rejected'].includes(tab.value)
                      ? tableData.filter((item) => item.status === tab.value).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onFilters={handleFilters}
            roleOptions={!isLoading && roles.map((item) => item.name)}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    ?.slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <UserTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            //
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
      <Toaster />
    </>
  );
}

UserListView.propTypes = {
  admins: PropTypes.array,
};

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, role } = filters;
  console.log(inputData);

  const stabilizedThis = inputData?.map((el, index) => [el, index]);

  stabilizedThis?.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis?.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) => user?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user?.admin?.role?.name));
  }

  return inputData;
}
