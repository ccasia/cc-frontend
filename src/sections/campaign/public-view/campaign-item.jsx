/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Card, Chip, Avatar, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import Image from 'src/components/image';

import CampaignModal from './dialog/campaign-dialog';

// ----------------------------------------------------------------------

export default function CampaignItem({ campaign, mutate }) {
  const campaignInfo = useBoolean();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const router = useRouter();

  const handleCardClick = () => {
    if (isMobile) {
      router.push(paths.dashboard.campaign.creator.discover(campaign.id));
    } else {
      campaignInfo.onTrue();
    }
  };

  const renderImage = (
    <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
      <Image
        alt={campaign?.name}
        src={campaign?.campaignBrief?.images[0]}
        sx={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 1 }}>
        <Chip
          label={campaign?.campaignBrief?.industries}
          sx={{
            backgroundColor: theme.palette.common.white,
            color: '#48484a',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '5px',
            height: '32px',
            border: '1.2px solid #e7e7e7',
            borderBottom: '3px solid #e7e7e7',
            '& .MuiChip-label': {
              padding: '0 8px',
            },
            '&:hover': {
              backgroundColor: theme.palette.common.white,
            },
          }}
        />
      </Box>
    </Box>
  );

  const renderCampaignInfo = (
    <Box sx={{ position: 'relative', pt: 2, px: 3, pb: 2.5 }}>
      <Avatar
        src={campaign?.brand?.logo || campaign?.company?.logo}
        alt={campaign?.brand?.name || campaign?.company?.name}
        sx={{
          width: 56,
          height: 56,
          border: '2px solid #ebebeb',
          borderRadius: '50%',
          position: 'absolute',
          top: -40,
          left: 17,
        }}
      />
      <Box sx={{ mt: 0.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 650,
            mb: -0.1,
            pb: 0.2,
            mt: 0.8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {campaign?.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: '#8e8e93',
            fontSize: '0.95rem',
            fontWeight: 550,
          }}
        >
          {campaign?.brand?.name || campaign?.company?.name}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s',
        bgcolor: 'background.paper',
        borderRadius: '15px',
        border: '1.2px solid',
        borderColor: '#ebebeb',
        position: 'relative',
        mb: -0.5,
        // height: 335,
        '&:hover': {
          borderColor: '#1340ff',
          transform: 'translateY(-2px)',
        },
      }}
      onClick={handleCardClick}
    >
      {false && (
        <Box
          mt={4}
          sx={{
            border: '1.5px solid #0062CD',
            borderBottom: '4px solid #0062CD',
            borderRadius: 1,
            p: 0.5,
            px: 1,
            mb: 1,
            position: 'absolute',
            right: 15,
            top: '38%',
            zIndex: 10000,
            bgcolor: 'white',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#0062CD',
              fontWeight: 600,
            }}
          >
            Partnered with KWSP i-Saraan{' '}
          </Typography>
        </Box>
      )}
      {renderImage}
      {renderCampaignInfo}

      <CampaignModal
        open={campaignInfo.value}
        handleClose={campaignInfo.onFalse}
        campaign={campaign}
      />
    </Card>
  );
}

CampaignItem.propTypes = {
  campaign: PropTypes.object,
  mutate: PropTypes.func,
};
