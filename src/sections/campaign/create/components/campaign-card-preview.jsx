import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { useWatch } from 'react-hook-form';

import { Box, Stack, Avatar, Typography } from '@mui/material';

const metaSx = { color: '#8E8E93', fontSize: '0.875rem', fontWeight: 500, minWidth: 0 };
const placeholderSx = { color: '#C7C7CC' };

const formatDate = (value) =>
  value && dayjs(value).isValid() ? dayjs(value).format('D MMM YYYY') : null;

// Mirrors the admin discover card (campaign-item.jsx) so the crop can be judged in place
export default function CampaignCardPreview({ image }) {
  const [name, industries, startDate, endDate, client, brand] = useWatch({
    name: [
      'campaignName',
      'campaignIndustries',
      'campaignStartDate',
      'campaignEndDate',
      'client',
      'campaignBrand',
    ],
  });

  const owner = brand ?? client;
  const industryText = Array.isArray(industries) ? industries.join(', ') : '';
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return (
    <Box
      aria-hidden
      sx={{
        width: 1,
        maxWidth: 320,
        mx: 'auto',
        bgcolor: '#F4F4F4',
        border: '1.2px solid #E7E7E7',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 180,
          overflow: 'hidden',
          bgcolor: '#E7E7E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Same as object-fit: cover on the real card */}
        <Box sx={{ flexShrink: 0, width: 'max(100%, 320px)' }}>{image}</Box>
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            bgcolor: '#FFFFFF',
            border: '1px solid #EBEBEB',
            boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
            fontSize: 12,
            fontWeight: 800,
            color: '#231F20',
          }}
        >
          PREVIEW
        </Box>
      </Box>

      <Box sx={{ position: 'relative', px: 2, pt: 2, pb: 2 }}>
        <Avatar
          src={owner?.logo}
          alt={owner?.name}
          sx={{
            width: 56,
            height: 56,
            border: '2px solid #EBEBEB',
            position: 'absolute',
            top: -40,
            left: 17,
            bgcolor: '#FFFFFF',
            color: '#C7C7CC',
          }}
        />
        <Box sx={{ mt: 0.5 }}>
          <Typography
            variant="h5"
            noWrap
            sx={{ fontWeight: 650, mt: 0.8, ...(!name && placeholderSx) }}
          >
            {name || 'Campaign name'}
          </Typography>
          <Typography
            variant="body2"
            noWrap
            sx={{ mb: 2, color: '#8E8E93', fontSize: '0.95rem', fontWeight: 550 }}
          >
            {owner?.name || 'Brand name'}
          </Typography>
        </Box>

        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <img src="/assets/icons/overview/IndustriesTag.svg" alt="" width={20} height={20} />
            <Typography noWrap sx={{ ...metaSx, ...(!industryText && placeholderSx) }}>
              {industryText || 'Industries'}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <img src="/assets/icons/overview/SmallCalendar.svg" alt="" width={20} height={20} />
            <Typography noWrap sx={{ ...metaSx, ...(!start && placeholderSx) }}>
              {start ? `${start} - ${end ?? '…'}` : 'Campaign dates'}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

CampaignCardPreview.propTypes = {
  image: PropTypes.node,
};
