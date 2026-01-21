import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Link,
  Chip,
  Stack,
  Avatar,
  Divider,
  Collapse,
  Typography,
  IconButton,
} from '@mui/material';

import { normalizeUrl } from 'src/utils/normalizeUrl';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

const ChipStyle = {
  bgcolor: '#FFF',
  border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 0.8,
  color: '#636366',
  minHeight: '35px',
  maxWidth: '100%',
  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-3px',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    py: 0.75,
    px: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  '&:hover': { bgcolor: '#FFF' },
};

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    p: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  '& .body': {
    p: 2,
  },
};

const CollapsibleBoxStyle = {
  borderRadius: 1,
  width: '100%',
  '& .header': {
    p: 0.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    cursor: 'pointer',
  },
  '& .body': {
    p: 2,
  },
};

const SectionTitleStyle = {
  variant: 'body2',
  fontSize: '0.8rem',
  fontFamily: 'InterDisplay',
  mb: 0.5,
  fontWeight: 650,
  color: '#8e8e93',
};

const SectionBodyStyle = {
  variant: 'body2',
  fontSize: '0.8rem',
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  if (string.toLowerCase() === 'f&b') return 'F&B';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const getlogisticsTypeLabel = (type) => {
  if (!type) return '';
  if (type === 'PRODUCT_DELIVERY') return 'Product Delivery';
  if (type === 'RESERVATION') return 'Reservation';
  return capitalizeFirstLetter(type);
};

const getProperInterestLabel = (value) => {
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

// Collapsible Section Header Component
const CollapsibleHeader = ({ icon, iconColor, title, expanded, onClick }) => (
  <Box
    className="header"
    onClick={onClick}
    sx={{
      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
      borderRadius: expanded ? '8px 8px 0 0' : 2,
			borderBottom: expanded ? `1px solid ${iconColor}` : ''
    }}
  >
    <Iconify
      icon={icon}
      sx={{
        color: iconColor,
        width: 20,
        height: 20,
        flexShrink: 0,
      }}
    />
    <Typography
      variant="body2"
      sx={{
        color: iconColor,
        fontWeight: 600,
        fontSize: '0.875rem',
        flex: 1,
      }}
    >
      {title}
    </Typography>
    <IconButton size="small" sx={{ p: 0.5 }}>
      <Iconify
        icon={expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'}
        sx={{ width: 20, height: 20, color: '#231F20' }}
      />
    </IconButton>
  </Box>
);

CollapsibleHeader.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const CampaignDetailContentMobile = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  // Collapsible states
  const [expandedSections, setExpandedSections] = useState({
    objectives: false,
    primaryAudience: false,
    secondaryAudience: false,
    additionalDetails1: false,
    additionalDetails2: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChatClick = async (admin) => {
    try {
      const response = await axiosInstance.get(endpoints.threads.getAll);
      const existingThread = response.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
        return (
          userIdsInThread.includes(user.id) &&
          userIdsInThread.includes(admin.user.id) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const newThreadResponse = await axiosInstance.post(endpoints.threads.create, {
          title: `Chat between ${user.name} & ${admin.user.name}`,
          description: '',
          userIds: [user.id, admin.user.id],
          isGroup: false,
        });
        navigate(`/dashboard/chat/thread/${newThreadResponse.data.id}`);
      }
    } catch (error) {
      console.error('Error creating or finding chat thread:', error);
    }
  };

  const requirement = campaign?.campaignRequirement;
  const additionalDetails = campaign?.campaignAdditionalDetails;

  // Check if secondary audience data exists
  const hasSecondaryAudience =
    requirement?.secondary_gender?.length > 0 ||
    requirement?.secondary_age?.length > 0 ||
    requirement?.secondary_country ||
    requirement?.secondary_geoLocation?.length > 0 ||
    requirement?.secondary_language?.length > 0 ||
    requirement?.secondary_creator_persona?.length > 0 ||
    requirement?.secondary_user_persona;

  // Check if Additional Details sections have data
  const hasAdditionalDetails1 =
    campaign?.campaignBrief?.socialMediaPlatform?.length > 0 ||
    additionalDetails?.contentFormat?.length > 0 ||
    campaign?.campaignBrief?.postingStartDate ||
    additionalDetails?.mainMessage ||
    additionalDetails?.keyPoints ||
    additionalDetails?.toneAndStyle ||
    additionalDetails?.brandGuidelinesUrl ||
    additionalDetails?.referenceContent ||
    additionalDetails?.productImage1Url ||
    additionalDetails?.productImage2Url;

  const hasAdditionalDetails2 =
    additionalDetails?.hashtagsToUse ||
    additionalDetails?.mentionsTagsRequired ||
    additionalDetails?.creatorCompensation ||
    additionalDetails?.ctaDesiredAction ||
    additionalDetails?.ctaLinkUrl ||
    additionalDetails?.ctaPromoCode ||
    additionalDetails?.ctaLinkInBioRequirements ||
    additionalDetails?.specialNotesInstructions ||
    additionalDetails?.needAds;

  // Helper to render Geographic Focus
  const getGeographicFocus = () => {
    if (!requirement?.geographic_focus) return 'Not specified';
    if (requirement.geographic_focus === 'SEAregion') return 'SEA Region';
    if (requirement.geographic_focus === 'others') return requirement.geographicFocusOthers;
    return capitalizeFirstLetter(requirement.geographic_focus);
  };

  // Helper to format posting timeline
  const getPostingTimeline = () => {
    const start = campaign?.campaignBrief?.postingStartDate;
    const end = campaign?.campaignBrief?.postingEndDate;
    if (!start && !end) return 'Not specified';

    const formatDate = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    if (start && end) {
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    return formatDate(start || end);
  };

  // Render audience content (used for both primary and secondary)
  const renderAudienceContent = (isPrimary = true) => {
    const prefix = isPrimary ? '' : 'secondary_';
    const gender = requirement?.[`${prefix}gender`];
    const age = requirement?.[`${prefix}age`];
    const country = requirement?.[`${prefix}country`];
    const language = requirement?.[`${prefix}language`];
    const creatorPersona = requirement?.[`${prefix}creator_persona`];
    const userPersona = requirement?.[`${prefix}user_persona`];

    return (
      <Stack spacing={2}>
        <Box>
          <Typography sx={SectionTitleStyle}>Gender</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {gender?.length > 0 ? (
              gender.map((value, idx) => (
                <Chip key={idx} label={capitalizeFirstLetter(value)} size="small" sx={ChipStyle} />
              ))
            ) : (
              <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
                Not specified
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography sx={SectionTitleStyle}>Age</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {age?.length > 0 ? (
              age.map((value, idx) => <Chip key={idx} label={value} size="small" sx={ChipStyle} />)
            ) : (
              <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
                Not specified
              </Typography>
            )}
          </Box>
        </Box>

        {country?.length > 0 && (
          <Box>
            <Typography sx={SectionTitleStyle}>Country</Typography>
            <Typography sx={SectionBodyStyle}>{country || 'Not specified'}</Typography>
          </Box>
        )}

        <Box>
          <Typography sx={SectionTitleStyle}>Language</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {language?.length > 0 ? (
              language.map((value, idx) => (
                <Chip key={idx} label={value} size="small" sx={ChipStyle} />
              ))
            ) : (
              <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
                Not specified
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography sx={SectionTitleStyle}>Creator&apos;s Interests</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {creatorPersona?.length > 0 ? (
              creatorPersona.map((value, idx) => (
                <Chip key={idx} label={getProperInterestLabel(value)} size="small" sx={ChipStyle} />
              ))
            ) : (
              <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
                Not specified
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography sx={SectionTitleStyle}>User Persona</Typography>
          <Typography sx={SectionBodyStyle}>{userPersona || 'Not specified'}</Typography>
        </Box>

        <Box>
          <Typography sx={SectionTitleStyle}>Geographic Focus</Typography>
          <Typography sx={SectionBodyStyle}>{getGeographicFocus()}</Typography>
        </Box>
      </Stack>
    );
  };

  // Render Additional Details 1
  const renderAdditionalDetails1 = () => (
    <Stack spacing={2}>
      {campaign?.campaignBrief?.socialMediaPlatform?.length > 0 && (
        <Box>
          <Typography sx={SectionTitleStyle}>Preferred Platforms</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {campaign.campaignBrief.socialMediaPlatform.map((platform, idx) => (
              <Chip
                key={idx}
                label={capitalizeFirstLetter(platform)}
                size="small"
                sx={ChipStyle}
              />
            ))}
          </Box>
        </Box>
      )}

      {additionalDetails?.contentFormat?.length > 0 && (
        <Box>
          <Typography sx={SectionTitleStyle}>Content Format</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {additionalDetails.contentFormat.map((format, idx) => (
              <Chip key={idx} label={format} size="small" sx={ChipStyle} />
            ))}
          </Box>
        </Box>
      )}

      {(campaign?.campaignBrief?.postingStartDate || campaign?.campaignBrief?.postingEndDate) && (
        <Box>
          <Typography sx={SectionTitleStyle}>Posting Timeline</Typography>
          <Typography sx={SectionBodyStyle}>{getPostingTimeline()}</Typography>
        </Box>
      )}

      {additionalDetails?.mainMessage && (
        <Box>
          <Typography sx={SectionTitleStyle}>Main Message/Theme</Typography>
          <Typography sx={SectionBodyStyle}>{additionalDetails.mainMessage}</Typography>
        </Box>
      )}

      {additionalDetails?.keyPoints && (
        <Box>
          <Typography sx={SectionTitleStyle}>Key Points to Cover</Typography>
          <Typography sx={{ ...SectionBodyStyle, whiteSpace: 'pre-line' }}>
            {additionalDetails.keyPoints}
          </Typography>
        </Box>
      )}

      {additionalDetails?.toneAndStyle && (
        <Box>
          <Typography sx={SectionTitleStyle}>Tone & Style</Typography>
          <Typography sx={{ ...SectionBodyStyle, whiteSpace: 'pre-line' }}>
            {additionalDetails.toneAndStyle}
          </Typography>
        </Box>
      )}

      {additionalDetails?.brandGuidelinesUrl &&
        (() => {
          const urls = additionalDetails.brandGuidelinesUrl
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean);
          return (
            <Box>
              <Typography sx={{ ...SectionTitleStyle, overflowWrap: 'anywhere' }}>
                Brand Guidelines Document{urls.length > 1 ? 's' : ''}
              </Typography>
              <Stack spacing={0.5}>
                {urls.map((url) => {
                  let filename = url.split('/').pop().split('?')[0];
                  filename = filename.replace(/_v=.*$/, '');
                  return (
                    <Link
                      key={url}
                      href={url}
                      target="_blank"
                      sx={{
                        fontSize: '0.8rem',
                        color: '#203ff5',
                        textDecoration: 'none',
                        overflowWrap: 'anywhere',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {filename}
                    </Link>
                  );
                })}
              </Stack>
            </Box>
          );
        })()}

      {additionalDetails?.referenceContent && (
        <Box>
          <Typography sx={{ ...SectionTitleStyle, overflowWrap: 'anywhere' }}>
            Reference Content/Inspiration
          </Typography>
          <Link
            href={additionalDetails.referenceContent}
            target="_blank"
            sx={{
              fontSize: '0.8rem',
              color: '#203ff5',
              textDecoration: 'none',
              overflowWrap: 'anywhere',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {additionalDetails.referenceContent}
          </Link>
        </Box>
      )}

      {(additionalDetails?.productImage1Url || additionalDetails?.productImage2Url) && (
        <Box>
          <Typography sx={SectionTitleStyle}>Product Images</Typography>
          <Stack spacing={0.5}>
            {additionalDetails?.productImage1Url &&
              (() => {
                const url = additionalDetails.productImage1Url;
                let filename = url.split('/').pop().split('?')[0];
                filename = filename.replace(/_v=.*$/, '');
                return (
                  <Link
                    href={url}
                    target="_blank"
                    sx={{
                      fontSize: '0.8rem',
                      color: '#203ff5',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {filename}
                  </Link>
                );
              })()}
            {additionalDetails?.productImage2Url &&
              (() => {
                const url = additionalDetails.productImage2Url;
                let filename = url.split('/').pop().split('?')[0];
                filename = filename.replace(/_v=.*$/, '');
                return (
                  <Link
                    href={url}
                    target="_blank"
                    sx={{
                      fontSize: '0.8rem',
                      color: '#203ff5',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {filename}
                  </Link>
                );
              })()}
          </Stack>
        </Box>
      )}
    </Stack>
  );

  // Render Additional Details 2
  const renderAdditionalDetails2 = () => (
    <Stack spacing={2}>
      <Box>
        <Typography sx={SectionTitleStyle}>Hashtags</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.hashtagsToUse || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Mentions/Tags Required</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.mentionsTagsRequired || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Creator Compensation</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.creatorCompensation || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Desired Action</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.ctaDesiredAction || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Link/URL</Typography>
        {additionalDetails?.ctaLinkUrl ? (
          <Link
            href={normalizeUrl(additionalDetails.ctaLinkUrl)}
            target="_blank"
            sx={{
              fontSize: '0.8rem',
              color: '#203ff5',
              textDecoration: 'none',
              overflowWrap: 'anywhere',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {additionalDetails.ctaLinkUrl}
          </Link>
        ) : (
          <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
            Not specified
          </Typography>
        )}
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Promo Code</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.ctaPromoCode || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Link in Bio Requirements</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.ctaLinkInBioRequirements || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Special Notes/Instructions</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.specialNotesInstructions || 'Not specified'}
        </Typography>
      </Box>

      <Box>
        <Typography sx={SectionTitleStyle}>Do you need ads?</Typography>
        <Typography sx={SectionBodyStyle}>
          {additionalDetails?.needAds
            ? capitalizeFirstLetter(additionalDetails.needAds)
            : 'Not specified'}
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ maxWidth: '100%', px: 1, mx: 'auto' }}>
      <Stack spacing={2}>
        {/* GENERAL INFORMATION - Not collapsible */}
        <Box sx={BoxStyle}>
          <Box className="header">
            <Iconify
              icon="material-symbols:info-outline"
              sx={{ width: 20, height: 20, color: '#0067D5' }}
            />
            <Typography
              variant="body2"
              sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.875rem' }}
            >
              GENERAL INFORMATION
            </Typography>
          </Box>

          <Stack spacing={2} className="body">
            <Box>
              <Typography sx={SectionTitleStyle}>Product / Service Name</Typography>
              <Typography sx={SectionBodyStyle}>
                {campaign?.productName || 'No product/service name.'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={SectionTitleStyle}>Campaign Info</Typography>
              <Typography sx={SectionBodyStyle}>
                {campaign?.description || 'No campaign description available.'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* CAMPAIGN OBJECTIVES - Collapsible */}
        <Box sx={{ ...CollapsibleBoxStyle, border: '1px solid #8A5AFE', boxShadow: '0px 2px 0px #8A5AFE' }}>
          <CollapsibleHeader
            icon="mingcute:target-line"
            iconColor="#8A5AFE"
            title="CAMPAIGN OBJECTIVES"
            expanded={expandedSections.objectives}
            onClick={() => toggleSection('objectives')}
          />
          <Collapse in={expandedSections.objectives}>
            <Stack className="body" spacing={2}>
              <Box>
                <Typography sx={SectionTitleStyle}>Primary Campaign Objective</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {campaign?.campaignBrief?.objectives ? (
                    <Chip label={campaign.campaignBrief.objectives} size="small" sx={ChipStyle} />
                  ) : (
                    <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
                      Not specified
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography sx={SectionTitleStyle}>Secondary Campaign Objective</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {campaign?.campaignBrief?.secondaryObjectives?.length > 0 ? (
                    campaign.campaignBrief.secondaryObjectives.map((objective, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          bgcolor: '#FFF',
                          border: '1px solid #EBEBEB',
                          borderRadius: 0.8,
                          color: '#636366',
                          padding: '0.6rem 0.8rem',
                          boxShadow: '0px 3px 0px #E7E7E7',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          display: 'inline-block',
                          maxWidth: '100%',
													mb: 0.5
                        }}
                      >
                        {objective}
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ ...SectionBodyStyle, color: 'text.secondary' }}>
                      Not specified
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography sx={SectionTitleStyle}>Promote Content</Typography>
                <Typography sx={SectionBodyStyle}>
                  {campaign?.campaignBrief?.boostContent
                    ? capitalizeFirstLetter(campaign.campaignBrief.boostContent)
                    : 'Not specified'}
                </Typography>
              </Box>

              <Box>
                <Typography sx={SectionTitleStyle}>Primary KPI</Typography>
                <Typography sx={SectionBodyStyle}>
                  {campaign?.campaignBrief?.primaryKPI || 'Not specified'}
                </Typography>
              </Box>

              <Box>
                <Typography sx={SectionTitleStyle}>Current Performance Baseline</Typography>
                <Typography sx={SectionBodyStyle}>
                  {campaign?.campaignBrief?.performanceBaseline || 'Not specified'}
                </Typography>
              </Box>
            </Stack>
          </Collapse>
        </Box>

        {/* PRIMARY AUDIENCE - Collapsible */}
        <Box sx={{ ...CollapsibleBoxStyle, border: '1px solid #FF3500', boxShadow: '0px 2px 0px #FF3500'}}>
          <CollapsibleHeader
            icon="material-symbols-light:groups-outline"
            iconColor="#FF3500"
            title="PRIMARY AUDIENCE"
            expanded={expandedSections.primaryAudience}
            onClick={() => toggleSection('primaryAudience')}
          />
          <Collapse in={expandedSections.primaryAudience}>
            <Box className="body">{renderAudienceContent(true)}</Box>
          </Collapse>
        </Box>

        {/* SECONDARY AUDIENCE - Collapsible (only if exists) */}
        {hasSecondaryAudience && (
          <Box sx={{ ...CollapsibleBoxStyle, border: '1px solid #FF3500', boxShadow: '0px 2px 0px #FF3500'}}>
            <CollapsibleHeader
              icon="material-symbols-light:groups-outline"
              iconColor="#FF3500"
              title="SECONDARY AUDIENCE"
              expanded={expandedSections.secondaryAudience}
              onClick={() => toggleSection('secondaryAudience')}
            />
            <Collapse in={expandedSections.secondaryAudience}>
              <Box className="body">{renderAudienceContent(false)}</Box>
            </Collapse>
          </Box>
        )}

        {/* ADDITIONAL DETAILS 1 - Collapsible */}
        {hasAdditionalDetails1 && (
          <Box sx={{ ...CollapsibleBoxStyle, border: '1px solid #026D54', boxShadow: '0px 2px 0px #026D54'}}>
            <CollapsibleHeader
              icon="material-symbols:note-stack-add-outline"
              iconColor="#026D54"
              title="ADDITIONAL DETAILS"
              expanded={expandedSections.additionalDetails1}
              onClick={() => toggleSection('additionalDetails1')}
            />
            <Collapse in={expandedSections.additionalDetails1}>
              <Box className="body">{renderAdditionalDetails1()}</Box>
            </Collapse>
          </Box>
        )}

        {/* ADDITIONAL DETAILS 2 - Collapsible */}
        {hasAdditionalDetails2 && (
          <Box sx={{ ...CollapsibleBoxStyle, border: '1px solid #026D54', boxShadow: '0px 2px 0px #026D54'}}>
            <CollapsibleHeader
              icon="material-symbols:note-stack-add-outline"
              iconColor="#026D54"
              title="ADDITIONAL DETAILS 2"
              expanded={expandedSections.additionalDetails2}
              onClick={() => toggleSection('additionalDetails2')}
            />
            <Collapse in={expandedSections.additionalDetails2}>
              <Box className="body">{renderAdditionalDetails2()}</Box>
            </Collapse>
          </Box>
        )}

        {/* DELIVERABLES - Not collapsible */}
        <Box sx={BoxStyle}>
          <Box className="header">
            <Iconify
              icon="material-symbols:unarchive-outline"
              sx={{ color: '#203ff5', width: 20, height: 20 }}
            />
            <Typography
              variant="body2"
              sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.875rem' }}
            >
              DELIVERABLES
            </Typography>
          </Box>

          <Box className="body" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                    }}
                  />
                )
            )}
          </Box>
        </Box>

        {/* LOGISTICS - Not collapsible */}
        {campaign?.logisticsType && (
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="material-symbols:inventory-2-outline-sharp"
                sx={{ color: '#CFB5F6', width: 20, height: 20 }}
              />
              <Typography
                variant="body2"
                sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.875rem' }}
              >
                LOGISTICS
              </Typography>
            </Box>
            <Box className="body">
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
                }}
              />
            </Box>
          </Box>
        )}

        {/* CAMPAIGN MANAGERS - Not collapsible */}
        <Box sx={BoxStyle}>
          <Box className="header">
            <Iconify
              icon="mdi:shield-person-outline"
              sx={{ color: '#026D54', width: 20, height: 20 }}
            />
            <Typography
              variant="body2"
              sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.875rem' }}
            >
              CAMPAIGN MANAGER(S)
            </Typography>
          </Box>

          <Stack spacing={1.5} className="body">
            {campaign?.campaignAdmin?.map((elem) => (
              <Stack key={elem.id} direction="row" alignItems="center" spacing={1}>
                <Avatar src={elem.admin.user.photoURL} sx={{ width: 34, height: 34 }} />
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                  {elem.admin.user.name}
                </Typography>
                {elem.admin.user.id === user.id ? (
                  <Chip
                    label="You"
                    sx={{
                      height: 32,
                      minWidth: 70,
                      bgcolor: '#f5f5f7',
                      color: '#8e8e93',
                      fontSize: '0.85rem',
                      fontWeight: 650,
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      '& .MuiChip-label': { px: 1.5, py: 2 },
                    }}
                  />
                ) : (
                  <Box
                    onClick={() => handleChatClick(elem.admin)}
                    sx={{
                      cursor: 'pointer',
                      px: 1.5,
                      py: 0.75,
                      minWidth: 70,
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      color: '#203ff5',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': { bgcolor: 'rgba(32, 63, 245, 0.04)' },
                    }}
                  >
                    Message
                  </Box>
                )}
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* CLIENT INFO - Not collapsible */}
        <Box sx={BoxStyle}>
          <Box className="header">
            <Iconify
              icon="material-symbols:loyalty-outline"
              sx={{ color: '#FF9FBD', width: 18, height: 18 }}
            />
            <Typography
              variant="body2"
              sx={{ color: '#221f20', fontWeight: 600, fontSize: '0.875rem' }}
            >
              CLIENT INFO
            </Typography>
          </Box>

          <Stack spacing={2} className="body">
            <Box>
              <Typography
                variant="body2"
                sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
              >
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
                <Typography sx={SectionBodyStyle}>
                  {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography sx={SectionTitleStyle}>About</Typography>
              <Typography sx={SectionBodyStyle}>
                {campaign?.company?.about || campaign?.brand?.company?.about || 'None'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={SectionTitleStyle}>Industry</Typography>
              <Typography sx={SectionBodyStyle}>
                {(() => {
                  const brands = campaign?.company?.brand || campaign?.brand;
                  if (Array.isArray(brands)) {
                    const allIndustries = brands
                      .flatMap((b) => (Array.isArray(b.industries) ? b.industries : []))
                      .filter(Boolean);
                    const uniqueIndustries = [...new Set(allIndustries)];
                    return uniqueIndustries.length > 0
                      ? uniqueIndustries.join(', ')
                      : 'Not specified';
                  }
                  if (brands?.industries) {
                    if (Array.isArray(brands.industries)) {
                      return brands.industries.length > 0
                        ? brands.industries.join(', ')
                        : 'Not specified';
                    }
                    return brands.industries;
                  }
                  return 'Not specified';
                })()}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={SectionTitleStyle}>Company Address</Typography>
              <Typography sx={SectionBodyStyle}>
                {campaign?.company?.address || campaign?.brand?.company?.address || 'Not specified'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={SectionTitleStyle}>Point of Contact: Name</Typography>
              <Typography sx={SectionBodyStyle}>
                {campaign?.company?.pic?.[0]?.name ||
                  campaign?.brand?.company?.pic?.[0]?.name ||
                  'Not specified'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={SectionTitleStyle}>Point of Contact: Email</Typography>
              <Typography sx={SectionBodyStyle}>
                {campaign?.company?.pic?.[0]?.email ||
                  campaign?.brand?.company?.pic?.[0]?.email ||
                  'Not specified'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={SectionTitleStyle}>Website</Typography>
              {campaign?.company?.website || campaign?.brand?.company?.website ? (
                <Link
                  href={
                    (campaign?.company?.website ?? campaign?.brand?.website)?.startsWith('http')
                      ? campaign?.company?.website ?? campaign?.brand?.website
                      : `https://${campaign?.company?.website ?? campaign?.brand?.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '0.8rem',
                    color: '#203ff5',
                    textDecoration: 'none',
                    overflowWrap: 'anywhere',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {campaign?.company?.website ?? campaign?.brand?.website}
                </Link>
              ) : (
                <Typography sx={SectionBodyStyle}>Not specified</Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

CampaignDetailContentMobile.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignDetailContentMobile;
