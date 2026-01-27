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
  Avatar,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';

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

const SubSectionTitleStyles = { color: '#8e8e93', mb: 0.5, fontWeight: 600 };

const getProperCase = (value) => {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower === 'f&b') return 'F&B';
  if (lower === 'fmcg') return 'FMCG';
  return value
    .split(' ')
    .map((word) =>
      word.length > 2 && word.toLowerCase() !== 'and'
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
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
      return `${fDate(startDate)} - ${fDate(endDate)}`;
    } catch (error) {
      return 'Invalid date format';
    }
  };

  const renderCampaignPostingPeriod = () => {
    const startDate = campaign?.campaignBrief?.postingStartDate;
    const endDate = campaign?.campaignBrief?.postingEndDate;

    if (!startDate || !endDate) {
      return 'Date not available';
    }

    try {
      return `${fDate(startDate)} - ${fDate(endDate)}`;
    } catch (error) {
      return 'Invalid date format';
    }
  };

  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const renderAccordionSummary = (panelName, iconName, title, color) => (
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
        <Iconify icon={iconName} width={20} color={color} />
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

  const industries = (() => {
    const brands = campaign?.company?.brand || campaign?.brand;
    if (Array.isArray(brands)) {
      // Flatten all industries from all brands, remove duplicates
      const allIndustries = brands
        .flatMap((b) => (Array.isArray(b.industries) ? b.industries : []))
        .filter(Boolean);
      const uniqueIndustries = [...new Set(allIndustries)];
      return uniqueIndustries.length > 0 ? uniqueIndustries : [];
    }
    const campaignIndustries = campaign?.campaignBrief?.industries;
    // Handle case where industries might be a string or array
    if (typeof campaignIndustries === 'string') {
      return campaignIndustries
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);
    }
    if (Array.isArray(campaignIndustries)) {
      return campaignIndustries;
    }
    return [];
  })();

  const getGeographicFocus = () => {
    if (!requirement?.geographic_focus) return 'Not specified';
    if (requirement.geographic_focus === 'SEAregion') return 'SEA Region';
    if (requirement.geographic_focus === 'others') return requirement.geographicFocusOthers;
    return capitalizeFirstLetter(requirement.geographic_focus);
  };

  const getlogisticsTypeLabel = (type) => {
    if (!type) return '';
    if (type === 'PRODUCT_DELIVERY') return 'Product Delivery';
    if (type === 'RESERVATION') return 'Reservation';
    return capitalizeFirstLetter(type);
  };

  const requirement = campaign?.campaignRequirement;

  const hasSecondaryAudience =
    requirement?.secondary_gender?.length > 0 ||
    requirement?.secondary_age?.length > 0 ||
    requirement?.secondary_country ||
    requirement?.secondary_language?.length > 0 ||
    requirement?.secondary_creator_persona?.length > 0 ||
    requirement?.secondary_user_persona;

  return (
    <Stack spacing={2} sx={{ p: 1 }}>
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
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 600 }}>
            Campaign Duration
          </Typography>
          <Typography variant="body2" sx={{ color: '#231F20', fontSize: '0.9rem' }}>
            {renderCampaignPeriod()}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 600 }}>
            Posting Period
          </Typography>
          <Typography variant="body2" sx={{ color: '#231F20', fontSize: '0.9rem' }}>
            {renderCampaignPostingPeriod()}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 1, fontWeight: 600 }}>
            Industry
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {industries.length > 0 ? (
              industries.map((industry, idx) => (
                <Chip key={idx} label={industry} size="small" sx={ChipStyle} />
              ))
            ) : (
              <Chip label="Not specified" size="small" sx={ChipStyle} />
            )}
          </Box>
        </Box>
      </Stack>

      {/* Requirements Section */}
      <Stack spacing={2}>
        {/* Gender and Age in two columns */}
        <Box sx={{ display: 'flex' }}>
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

        {/* Language and Creator Persona in two columns */}
        <Box sx={{ display: 'flex' }}>
          {/* Left column - Language */}
          <Box sx={{ flex: 1 }}>
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
          )}

        <Box>
          <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 600 }}>
            Geographic Focus
          </Typography>
          <Typography variant="body2" sx={{ color: '#231F20', fontSize: '0.9rem' }}>
            {getGeographicFocus()}
          </Typography>
        </Box>
      </Stack>

      {/* Add Divider */}
      <Divider sx={{ borderColor: '#EBEBEB', width: '100%', borderWidth: 1 }} />

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
      <Stack spacing={1}>
        {/* Campaign General Info */}
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
            'material-symbols:info-outline',
            'GENERAL INFORMATION',
            '#0067D5'
          )}
          <AccordionDetails
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, px: 0.5 }}
          >
            <Box>
              <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                Product / Service Name
              </Typography>
              <Typography variant="body2">{campaign?.productName}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                Campaign Info
              </Typography>
              <Typography variant="body2">{campaign?.description}</Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Secondary Audience */}
        {hasSecondaryAudience && (
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
              'material-symbols-light:groups-outline',
              'SECONDARY AUDIENCE',
              '#FF3500'
            )}
            <AccordionDetails
              sx={{ display: 'flex', flexDirection: 'row', gap: 2, pt: 2, px: 0.5 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                {[
                  {
                    label: 'Gender',
                    data: campaign?.campaignRequirement?.secondary_gender?.map(
                      capitalizeFirstLetter
                    ),
                  },
                  { label: 'Age', data: campaign?.campaignRequirement?.secondary_age },
                  {
                    label: 'Country',
                    data: campaign?.campaignRequirement?.secondary_country
                      ? [campaign.campaignRequirement.secondary_country]
                      : [],
                  },
                  {
                    label: 'Language',
                    data: campaign?.campaignRequirement?.secondary_language,
                  },
                ].map((item, index) => (
                  <Box key={index}>
                    <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {item.data?.map((value, idx) => (
                        <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                    Creator&apos;s Interest
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {requirement?.secondary_creator_persona.map((value, idx) => (
                      <Chip key={idx} label={getProperCase(value)} size="small" sx={ChipStyle} />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                    User Persona
                  </Typography>
                  <Typography variant="body2">{requirement?.secondary_user_persona}</Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Deliverables */}
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
            'material-symbols:unarchive-outline',
            'DELIVERABLES',
            '#203ff5'
          )}
          <AccordionDetails sx={{ pt: 2, px: 0.5 }}>
            {[
              { label: 'UGC Videos', value: true },
              { label: 'Raw Footage', value: campaign?.rawFootage },
              { label: 'Photos', value: campaign?.photos },
              { label: 'Ads', value: campaign?.ads },
              { label: 'Cross Posting', value: campaign?.crossPosting },
            ].map(
              (deliverable) =>
                deliverable.value && (
                  <Chip
                    key={deliverable.label}
                    label={deliverable.label}
                    size="medium"
                    sx={{
                      bgcolor: '#F5F5F5',
                      borderRadius: 1,
                      color: '#231F20',
                      height: '32px',
                      '& .MuiChip-label': {
                        fontWeight: 700,
                        px: 1.5,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      '&:hover': { bgcolor: '#F5F5F5' },
                    }}
                  />
                )
            )}
          </AccordionDetails>
        </Accordion>

        {/* Logistics */}
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
            'material-symbols:inventory-2-outline-sharp',
            'LOGISTICS',
            '#CFB5F6'
          )}
          <AccordionDetails sx={{ pt: 2, px: 0.5 }}>
            <Chip
              label={getlogisticsTypeLabel(campaign?.logisticsType) || 'Not specified'}
              size="small"
              sx={{
                bgcolor: '#F5F5F5',
                borderRadius: 1,
                color: '#231F20',
                height: '32px',
                '& .MuiChip-label': {
                  fontWeight: 700,
                  px: 1.5,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '-3px',
                },
                '&:hover': { bgcolor: '#F5F5F5' },
              }}
            />
          </AccordionDetails>
        </Accordion>

        {/* Client Info */}
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
            'material-symbols:loyalty-outline',
            'CLIENT INFO',
            '#FF9FBD'
          )}
          <AccordionDetails
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, px: 0.5 }}
          >
            <Box>
              <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                Client
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={campaign?.company?.logo ?? campaign?.brand?.logo}
                  alt={campaign?.company?.name ?? campaign?.brand?.name}
                  sx={{
                    width: 36,
                    height: 36,
                    border: '2px solid',
                    borderColor: 'background.paper',
                  }}
                />
                <Typography variant="body2">
                  {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ ...SubSectionTitleStyles }}>
                About
              </Typography>
              <Typography variant="body2">
                {campaign?.brandAbout ||
                  campaign?.brand?.company?.about ||
                  campaign?.company?.about ||
                  'None'}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Stack>
  );
};

CampaignModalMobile.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignModalMobile;
