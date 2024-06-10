import PropTypes from 'prop-types';

import { Box } from '@mui/material';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { bgGradient } from 'src/theme/css';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function JobItem({ campaign, onView, onEdit, onDelete }) {
  const popover = usePopover();

  const { title, company } = campaign;

  const interestsChips = (
    <Stack direction="row" spacing={1} mt={1}>
      <Chip
        label="Technology"
        size="small"
        color="primary"
        sx={{
          borderRadius: 2,
        }}
      />
      <Chip
        label="Game"
        size="small"
        color="primary"
        sx={{
          borderRadius: 2,
        }}
      />
    </Stack>
  );

  return (
    <>
      <Card>
        <IconButton onClick={popover.onOpen} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        <Stack sx={{ p: 3, pb: 2 }}>
          <Avatar
            alt={company.name}
            src={company.logo}
            variant="rounded"
            sx={{ width: 48, height: 48, mb: 2 }}
          />

          <ListItemText
            sx={{ mb: 1 }}
            primary={
              <Link component={RouterLink} color="inherit">
                {title}
              </Link>
            }
            primaryTypographyProps={{
              typography: 'subtitle1',
            }}
          />

          {interestsChips}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack
          direction="row"
          justifyContent="space-around"
          p={3}
          alignItems="center"
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="caption">Start</Typography>
            <Typography variant="caption">June 16, 2024</Typography>
          </Stack>

          <Box
            sx={{
              minWidth: 70,
              bgcolor: (theme) => ({
                ...bgGradient({
                  startColor: theme.palette.success.light,
                  endColor: theme.palette.error.light,
                  direction: 'to right',
                }),
              }),
              height: 2,
              borderRadius: 10,
            }}
          />

          <Stack spacing={0.5} alignItems="center">
            <Typography variant="caption">End</Typography>
            <Typography variant="caption">June 16, 2024</Typography>
          </Stack>
        </Stack>

        {/* <Box rowGap={1.5} display="grid" gridTemplateColumns="repeat(2, 1fr)" sx={{ p: 3 }}>
          {[
            {
              label: experience,
              icon: <Iconify width={16} icon="carbon:skill-level-basic" sx={{ flexShrink: 0 }} />,
            },
            {
              label: employmentTypes.join(', '),
              icon: <Iconify width={16} icon="solar:clock-circle-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: salary.negotiable ? 'Negotiable' : salary.price,
              icon: <Iconify width={16} icon="solar:wad-of-money-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: role,
              icon: <Iconify width={16} icon="solar:user-rounded-bold" sx={{ flexShrink: 0 }} />,
            },
          ].map((item) => (
            <Stack
              key={item.label}
              spacing={0.5}
              flexShrink={0}
              direction="row"
              alignItems="center"
              sx={{ color: 'text.disabled', minWidth: 0 }}
            >
              {item.icon}
              <Typography variant="caption" noWrap>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Box> */}
      </Card>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onView();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          View
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>
    </>
  );
}

JobItem.propTypes = {
  campaign: PropTypes.object,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
};
