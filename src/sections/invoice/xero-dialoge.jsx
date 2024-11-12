import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import useGetContacts from 'src/hooks/use-get-xeroContacts';

import FormProvider from 'src/components/hook-form/form-provider';
import { RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

function XeroDialoge({ open, onClose, description, setContact, setNewContact }) {
  const { isLoading, contacts } = useGetContacts();

  const methods = useForm({
    defaultValues: {
      contact: { name: '' },
      type: '',
      description: '',
    },
  });
  const { handleSubmit, watch, setValue, reset } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setContact(data);
    } catch (error) {
      console.log(error);
    }
  });

  const values = watch();

  if (isLoading)
    return (
      <Dialog
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDialog-paper': {
            width: '50%',
          },
        }}
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </Dialog>
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          width: '50%',
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Select New contact on Xero Api</DialogTitle>
        <DialogContent>
          <Box
            rowGap={1}
            columnGap={1}
            display="flex"
            flexDirection="column"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
            padding={1}
          >
            <RHFAutocomplete
              name="contact"
              label="Select Contact"
              options={contacts || [{ name: 'No Contacts' }]}
              getOptionLabel={(option) => option.name}
              value={values.contact}
              onChange={(e, value) => setValue('contact', value)}
            />
            <RHFAutocomplete
              name="type"
              label="Invoice Type"
              options={['ACCPAY', 'ACCREC']}
              value={values.type}
              onChange={(e, value) => setValue('type', value)}
            />

            <RHFTextField
              name="description"
              label="Description"
              multiline
              rows={3}
              defaultValue={description}
              variant="outlined"
              value={values.description}
            />
            <Box flexGrow={1} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              onClose();
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="inherit"
            onClick={() => {
              onSubmit();
              onClose();
              reset();
            }}
          >
            Confirm
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setNewContact(true);
              onClose();
            }}
          >
            Create New
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

export default XeroDialoge;

XeroDialoge.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  // contacts: PropTypes.array,
  description: PropTypes.string,
  // type: PropTypes.string,
  setContact: PropTypes.func,
  setNewContact: PropTypes.func,
};
