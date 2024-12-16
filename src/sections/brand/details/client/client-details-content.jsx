/* eslint-disable no-unused-vars */
import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDate } from 'src/utils/format-time';
// import { fCurrency } from 'src/utils/format-number';

import { formatText } from 'src/utils/format-test';

import Iconify from 'src/components/iconify';
// import Markdown from 'src/components/markdown';

// ----------------------------------------------------------------------

export default function ClientDetailsContent({ company }) {
  const {
    about,
    address,
    email,
    id,
    phone,
    objectives,
    registration_number,
    website,
    brand,
    logo,
    name,
    createdAt,
  } = company;

  const renderContent = (
    <Stack component={Card} spacing={3} sx={{ p: 3 }}>
      {/* <Typography variant="h4">{formatText(name)}</Typography> */}
      <ListItemText
        primary="Client's Name"
        secondary={formatText(name)}
        primaryTypographyProps={{
          variant: 'h6',
        }}
        secondaryTypographyProps={{
          variant: 'subtitle1',
        }}
      />

      <ListItemText
        primary="About"
        secondary={about || 'None'}
        primaryTypographyProps={{
          variant: 'h6',
        }}
        secondaryTypographyProps={{
          variant: 'subtitle1',
        }}
      />

      {/* <Stack spacing={1}>
        <Typography variant="h6">About</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="inherit">{about}</Typography>
        </Stack>
      </Stack> */}

      {objectives?.length > 0 && (
        <Stack>
          <Typography variant="h6">Objectives</Typography>
          <Stack direction="row" alignItems="center">
            <ul>
              {objectives?.map((elem) => (
                <li>
                  <Typography variant="inherit">{elem.value}</Typography>
                </li>
              ))}
            </ul>
          </Stack>
        </Stack>
      )}
    </Stack>
  );

  const renderOverview = (
    <Stack component={Card} spacing={2} sx={{ p: 3 }}>
      {[
        {
          label: 'Invoice Date',
          value: fDate(createdAt),
          icon: <Iconify icon="solar:calendar-date-bold" width={20} />,
        },
        {
          label: 'Registration Number',
          value: registration_number,
          icon: <Iconify icon="mdi-id-card" width={20} />,
        },
      ].map((item) => (
        <Stack key={item.label} spacing={1.5} direction="row" alignItems="start">
          {item.icon}
          <ListItemText
            primary={item.label}
            secondary={item.value}
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      ))}
    </Stack>
  );

  const renderCompany = (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={2}
      direction="row"
      sx={{ p: 3, borderRadius: 2, mt: 3 }}
    >
      <Avatar alt={name} src={logo} variant="rounded" sx={{ width: 64, height: 64 }} />

      <Stack spacing={1}>
        <Typography variant="subtitle1">{name}</Typography>
        <Typography variant="body2">{email}</Typography>
        <Typography variant="body2">{phone}</Typography>
        <Typography variant="body2">{address}</Typography>
      </Stack>
    </Stack>
  );

  const renderBilling = (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={2}
      direction="row"
      sx={{ p: 3, borderRadius: 2, mt: 3 }}
    >
      <Typography variant="h5">Billing information</Typography>
    </Stack>
  );

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={8}>
        {renderContent}

        {/* {renderBilling} */}
      </Grid>

      <Grid xs={12} md={4}>
        {renderOverview}

        {renderCompany}
      </Grid>
    </Grid>
  );
}

ClientDetailsContent.propTypes = {
  company: PropTypes.object,
};
