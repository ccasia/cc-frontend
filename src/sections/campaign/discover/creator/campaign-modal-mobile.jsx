import React from 'react';
import PropTypes from 'prop-types';

import { Box, Chip, Stack, Divider, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

const ChipStyle = {
  bgcolor: '#FFF',
  border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 1,
  color: '#636366',
  height: '32px',
  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 700,
    px: 1.5,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-3px',
  },
  '&:hover': { bgcolor: '#FFF' },
};

const SectionHeader = ({ icon, title, color }) => (
  <Box
    sx={{
      border: `1.5px solid ${color}`,
      borderBottom: `4px solid ${color}`,
      borderRadius: 1,
      p: 1,
      mb: 1,
      width: 'fit-content',
    }}
  >
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        component="img"
        src={icon}
        sx={{
          width: 20,
          height: 20,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color,
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
    </Stack>
  </Box>
);

SectionHeader.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

const CampaignModalMobile = ({ campaign }) => {
  const renderCampaignPeriod = () => {
    const startDate = campaign?.campaignBrief?.startDate;
    const endDate = campaign?.campaignBrief?.endDate;

    if (!startDate || !endDate) {
      return 'Date not available';
    }

    try {
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
      - ${new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } catch (error) {
      return 'Invalid date format';
    }
  };

  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Divider sx={{ 
        borderColor: '#EBEBEB',
        width: '100%',
        borderWidth: 1,
        mt: 1,
      }} />
      
      {/* Campaign Period & Industry */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 600 }}>
            Campaign Duration
          </Typography>
          <Typography variant="body2" sx={{ color: '#231F20', fontSize: '0.9rem' }}>{renderCampaignPeriod()}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 600 }}>
            Industry
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={campaign?.campaignBrief?.industries || 'Not specified'}
              size="small"
              sx={ChipStyle}
            />
          </Box>
        </Box>
      </Stack>

      {/* Campaign Details */}
      <Box>
        <SectionHeader 
          icon="/assets/icons/components/ic_bluesmiley.svg" 
          title="CAMPAIGN DETAILS" 
          color="#203ff5" 
        />
        <Typography
          variant="body2"
          sx={{
            pl: 0.5,
            textAlign: 'justify',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            maxWidth: '100%',
          }}
        >
          {campaign?.description}
        </Typography>
      </Box>

      {/* Campaign Objectives */}
      <Box>
        <SectionHeader 
        icon="/assets/icons/components/ic_objectives.svg" 
        title="CAMPAIGN OBJECTIVES" 
        color="#835cf5" 
        />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
          <Iconify
            icon="octicon:dot-fill-16"
            sx={{
              color: '#000000',
              width: 12,
              height: 12,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {campaign?.campaignBrief?.objectives}
          </Typography>
        </Stack>
      </Box>

      {/* Campaign Deliverables */}
      <Box>
        <SectionHeader 
        icon="/assets/icons/components/ic_deliverables.svg" 
        title="CAMPAIGN DELIVERABLES" 
        color="#203ff5" 
        />
        <Stack spacing={1} sx={{ pl: 0.5 }}>
          {[
            { label: 'UGC Videos', value: true },
            { label: 'Raw Footage', value: campaign?.rawFootage },
            { label: 'Photos', value: campaign?.photos },
            { label: 'Ads', value: campaign?.ads },
          ].map((deliverable) => (
            deliverable.value && (
              <Stack key={deliverable.label} direction="row" spacing={1} alignItems="center">
                <Iconify
                  icon="octicon:dot-fill-16"
                  sx={{
                    color: '#000000',
                    width: 12,
                    height: 12,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {deliverable.label}
                </Typography>
              </Stack>
            )
          ))}
        </Stack>
      </Box>

      {/* Campaign Do's */}
      <Box>
        <SectionHeader 
        icon="/assets/icons/components/ic_dos.svg" 
        title="CAMPAIGN DO'S!" 
        color="#026D54" 
        />
        <Stack spacing={1} sx={{ pl: 0.5 }}>
          {campaign?.campaignBrief?.campaigns_do?.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              <Iconify
                icon="octicon:dot-fill-16"
                sx={{
                  color: '#000000',
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {item.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Campaign Don'ts */}
      <Box>
        <SectionHeader
          icon="/assets/icons/components/ic_donts.svg"
          title="CAMPAIGN DONT'S!"
          color="#eb4a26"
        />
        <Stack spacing={1} sx={{ pl: 0.5 }}>
          {campaign?.campaignBrief?.campaigns_dont?.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              <Iconify
                icon="octicon:dot-fill-16"
                sx={{
                  color: '#000000',
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {item.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Add Divider */}
      <Divider sx={{ borderColor: '#EBEBEB', width: '100%', borderWidth: 1 }} />

      {/* Requirements Section */}
      <Stack spacing={3}>
        {[
          { label: 'Gender', data: campaign?.campaignRequirement?.gender?.map(capitalizeFirstLetter) },
          { label: 'Age', data: campaign?.campaignRequirement?.age },
          { label: 'Geo Location', data: campaign?.campaignRequirement?.geoLocation },
          { label: 'Language', data: campaign?.campaignRequirement?.language },
          {
            label: 'Creator Persona',
            data: campaign?.campaignRequirement?.creator_persona?.map(value => 
              value.toLowerCase() === 'f&b' ? 'F&B' : capitalizeFirstLetter(value)
            ),
          },
        ].map((item, index) => (
          <Box key={index}>
            <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
              {item.label}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {item.data?.map((value, idx) => (
                <Chip key={idx} label={value} size="small" sx={ChipStyle} />
              ))}
            </Box>
          </Box>
        ))}
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
            User Persona
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 420,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              maxWidth: '100%',
            }}
          >
            {campaign?.campaignRequirement?.user_persona}
          </Typography>
        </Box>
      </Stack>

    </Stack>
  );
};

CampaignModalMobile.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignModalMobile;
