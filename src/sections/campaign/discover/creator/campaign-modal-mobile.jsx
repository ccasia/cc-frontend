import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Chip,
  Stack,
  Divider,
  Accordion,
  Typography,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const ChipStyle = {
  bgcolor: '#EFEFEF',
  // border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 2,
  color: '#636366',
  height: '24px',
  // boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 600,
    px: 1.5,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: '-3px',
  },
  '&:hover': { bgcolor: '#EFEFEF' },
};

// using MUI Accordion library

// const SectionHeader = ({ icon, title, color }) => (
//   <Box
//     sx={{
//       border: `1.5px solid ${color}`,
//       borderBottom: `4px solid ${color}`,
//       borderRadius: 1,
//       p: 1,
//       mb: 1,
//       width: 'fit-content',
//     }}
//   >
//     <Stack direction="row" spacing={1} alignItems="center">
//       <Box
//         component="img"
//         src={icon}
//         sx={{
//           width: 20,
//           height: 20,
//         }}
//       />
//       <Typography
//         variant="body2"
//         sx={{
//           color,
//           fontWeight: 600,
//         }}
//       >
//         {title}
//       </Typography>
//     </Stack>
//   </Box>
// );

// SectionHeader.propTypes = {
//   icon: PropTypes.string.isRequired,
//   title: PropTypes.string.isRequired,
//   color: PropTypes.string.isRequired,
// };

const CampaignModalMobile = ({ campaign }) => {
  const renderCampaignPeriod = () => {
    const startDate = campaign?.campaignBrief?.startDate;
    const endDate = campaign?.campaignBrief?.endDate;

    if (!startDate || !endDate) {
      return 'Date not available';
    }

    try {
      return `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} 
      - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } catch (error) {
      return 'Invalid date format';
    }
  };

  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const renderAccordionSummary = (panelName, iconPath, title, color) => (
    <AccordionSummary
      expandIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
      aria-controls={`${panelName}-content`}
      id={`${panelName}-header`}
      sx={{
        border: `1.5px solid ${color}`,
        borderBottom: `4px solid ${color}`,
        borderRadius: 1,
        p: 1,
        minHeight: '38px',
        '& .MuiAccordionSummary-content': {
          my: 0,
          '&.Mui-expanded': {
            my: 0,
          },
        },
        '& .MuiAccordionSummary-expandIconWrapper': {
          transition: 'transform 0.2s',
          '&.Mui-expanded': {
            transform: 'rotate(90deg)',
          },
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          component="img"
          src={iconPath}
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
    </AccordionSummary>
  );

  const hasCampaignDetails = campaign?.description && campaign.description.trim() !== '';
  const hasCampaignObjectives =
    campaign?.campaignBrief?.objectives && campaign.campaignBrief.objectives.trim() !== '';
  const hasCampaignDos =
    campaign?.campaignBrief?.campaigns_do && campaign.campaignBrief.campaigns_do.length > 0;
  const hasCampaignDonts =
    campaign?.campaignBrief?.campaigns_dont && campaign.campaignBrief.campaigns_dont.length > 0;

  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      <Divider
        sx={{
          borderColor: '#EBEBEB',
          width: '100%',
          borderWidth: 1,
          mt: 1,
        }}
      />

      {/* Campaign Period & Industry */}
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
            Campaign Period
          </Typography>
          <Typography variant="body2" sx={{ color: '#231F20', fontSize: '0.9rem' }}>
            {renderCampaignPeriod()}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
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

      {/* Requirements Section */}
      <Stack spacing={3}>
        {/* Gender and Age in two columns */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Left column - Gender */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
              Gender
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {campaign?.campaignRequirement?.gender
                ?.map(capitalizeFirstLetter)
                .map((value, idx) => (
                  <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                ))}
            </Box>
          </Box>

          {/* Right column - Age */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
              Age
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {campaign?.campaignRequirement?.age?.map((value, idx) => (
                <Chip key={idx} label={value} size="small" sx={ChipStyle} />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Geo Location row */}
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
            Geo Location
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {campaign?.campaignRequirement?.geoLocation?.map((value, idx) => (
              <Chip key={idx} label={value} size="small" sx={ChipStyle} />
            ))}
          </Box>
        </Box>

        {/* Language and Creator Persona in two columns */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Left column - Language */}
          <Box sx={{ flex: 1.5 }}>
            <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
              Language
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {campaign?.campaignRequirement?.language?.map((value, idx) => (
                <Chip key={idx} label={value} size="small" sx={ChipStyle} />
              ))}
            </Box>
          </Box>

          {/* Right column - Creator Persona */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
              Creator Persona
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {campaign?.campaignRequirement?.creator_persona
                ?.map((value) =>
                  value.toLowerCase() === 'f&b' ? 'F&B' : capitalizeFirstLetter(value)
                )
                .map((value, idx) => (
                  <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                ))}
            </Box>
          </Box>
        </Box>

        {/* User Persona row - changed to only show when user persona exists */}
        {campaign?.campaignRequirement?.user_persona &&
          campaign.campaignRequirement.user_persona.trim() !== '' && (
            <Box>
              <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 650 }}>
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
          )}
      </Stack>

      {/* Add Divider */}
      <Divider sx={{ borderColor: '#EBEBEB', width: '100%', borderWidth: 1, mt: 2, mb: 3 }} />

      {/* Campaign Details */}
      {/* <Box>
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
      </Box> */}

      {/* Campaign Objectives */}
      {/* <Box>
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
      </Box> */}

      {/* Campaign Deliverables */}
      {/* <Box>
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
          ].map(
            (deliverable) =>
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
          )}
        </Stack>
      </Box> */}

      {/* Campaign Do's */}
      {/* <Box>
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
      </Box> */}

      {/* Campaign Don'ts */}
      {/* <Box>
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
      </Box> */}

      {/* Campaign Details */}
      {hasCampaignDetails && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            '&.MuiAccordion-root': {
              border: 'none',
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
            },
          }}
        >
          {renderAccordionSummary(
            'panel1',
            '/assets/icons/components/ic_bluesmiley.svg',
            'CAMPAIGN DETAILS',
            '#203ff5'
          )}
          <AccordionDetails sx={{ pt: 1, pl: 0.5, pr: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                textAlign: 'justify',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                maxWidth: '100%',
              }}
            >
              {campaign?.description}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Campaign Objectives */}
      {hasCampaignObjectives && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            '&.MuiAccordion-root': {
              border: 'none',
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
            },
          }}
        >
          {renderAccordionSummary(
            'panel2',
            '/assets/icons/components/ic_objectives.svg',
            'CAMPAIGN OBJECTIVES',
            '#835cf5'
          )}
          <AccordionDetails sx={{ pt: 1, pl: 0.5, pr: 0.5 }}>
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
          </AccordionDetails>
        </Accordion>
      )}

      {/* Campaign Do's */}
      {hasCampaignDos && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            '&.MuiAccordion-root': {
              border: 'none',
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
            },
          }}
        >
          {renderAccordionSummary(
            'panel3',
            '/assets/icons/components/ic_dos.svg',
            "CAMPAIGN DO'S!",
            '#026D54'
          )}
          <AccordionDetails sx={{ pt: 1, pl: 0.5, pr: 0.5 }}>
            <Stack spacing={1} sx={{ pl: 0.5 }}>
              {campaign?.campaignBrief?.campaigns_do.map((item, index) => (
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
          </AccordionDetails>
        </Accordion>
      )}

      {/* Campaign Don'ts */}
      {hasCampaignDonts && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            '&.MuiAccordion-root': {
              border: 'none',
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
            },
          }}
        >
          {renderAccordionSummary(
            'panel4',
            '/assets/icons/components/ic_donts.svg',
            "CAMPAIGN DONT'S!",
            '#eb4a26'
          )}
          <AccordionDetails sx={{ pt: 1, pl: 0.5, pr: 0.5 }}>
            <Stack spacing={1} sx={{ pl: 0.5 }}>
              {campaign?.campaignBrief?.campaigns_dont.map((item, index) => (
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
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
};

CampaignModalMobile.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignModalMobile;
