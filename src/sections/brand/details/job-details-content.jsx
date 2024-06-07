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

import Iconify from 'src/components/iconify';
// import Markdown from 'src/components/markdown';

// ----------------------------------------------------------------------

export default function JobDetailsContent({ company }) {
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
      <Typography variant="h4">{name}</Typography>

      {/* <Markdown children={content} /> */}

      <Stack spacing={1}>
        <Typography variant="h6">About</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="inherit">{about}</Typography>
        </Stack>
      </Stack>

      {objectives.length > 0 && (
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
          label: 'Date Created',
          value: fDate(createdAt),
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
        {
          label: 'Registration Number',
          value: registration_number,
          icon: <Iconify icon="solar:calendar-date-bold" />,
        },
      ].map((item) => (
        <Stack key={item.label} spacing={1.5} direction="row">
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

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={8}>
        {renderContent}
      </Grid>

      <Grid xs={12} md={4}>
        {renderOverview}

        {renderCompany}
      </Grid>
    </Grid>
  );
}

JobDetailsContent.propTypes = {
  company: PropTypes.object,
};
