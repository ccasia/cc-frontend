import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@mui/material/styles';
import { Box, Link, Chip, Stack, Avatar, Divider, Typography, useMediaQuery } from '@mui/material';

import { normalizeUrl } from 'src/utils/normalizeUrl';
import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import CampaignDetailContentMobile from './campaign-detail-content-mobile';

const ChipStyle = {
  bgcolor: '#FFF',
  border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 0.8,
  color: '#636366',
  height: '35px',
  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 700,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-3px',
  },
  '&:hover': { bgcolor: '#FFF' },
};

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  width: '100%',
  mb: 2,
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    p: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  '& .body': {
    p: 2.5,
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

const CampaignDetailContentClient = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  // Render mobile version on smaller screens
  if (isMobile) {
    return <CampaignDetailContentMobile campaign={campaign} />;
  }

  return (
    <Box
      sx={{
        maxWidth: '100%',
        px: 1,
        mx: 'auto',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* Left Column */}
        <Stack sx={{ flex: { xs: 1, md: 2.5 } }}>
          {false && (
            <Box
              mt={4}
              sx={{
                border: '1.5px solid #0062CD',
                borderBottom: '4px solid #0062CD',
                borderRadius: 1,
                p: 1,
                mb: 1,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#0062CD',
                      fontWeight: 600,
                    }}
                  >
                    Partnered with KWSP i-Saraan{' '}
                  </Typography>
                  <Divider />
                  <Typography variant="caption" color="black" fontWeight={400}>
                    Score an extra RM100! T&amp;C&apos;s apply.
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* GENERAL INFORMATION */}
          <Box sx={{ ...BoxStyle, mt: 1 }}>
            <Box className="header">
              <Iconify
                icon="material-symbols:info-outline"
                sx={{
                  width: 20,
                  height: 20,
                  color: '#0067D5',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                GENERAL INFORMATION
              </Typography>
            </Box>

            <Stack spacing={2} className="body">
              <Box>
                <Typography sx={SectionTitleStyle}>Product / Service Name</Typography>
                <Typography sx={SectionBodyStyle}>
                  {campaign?.productName || 'Not specified'}
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

          {/* CAMPAIGN OBJECTIVES */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mingcute:target-line"
                sx={{
                  color: '#8A5AFE',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN OBJECTIVES
              </Typography>
            </Box>

            <Stack className="body" justifyContent="space-between" direction="row" spacing={2}>
              <Stack spacing={2} flex={1}>
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
                            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            display: 'inline-block',
                            maxWidth: '100%',
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
              </Stack>

              <Stack spacing={2} flex={1}>
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
            </Stack>
          </Box>

          {/* TARGET AUDIENCE */}
          {(() => {
            // Check if secondary audience data exists
            const hasSecondaryAudience =
              requirement?.secondary_gender?.length > 0 ||
              requirement?.secondary_age?.length > 0 ||
              requirement?.secondary_country ||
              requirement?.secondary_geoLocation?.length > 0 ||
              requirement?.secondary_language?.length > 0 ||
              requirement?.secondary_creator_persona?.length > 0 ||
              requirement?.secondary_user_persona;

            // Helper to render Geographic Focus without nested ternary
            const getGeographicFocus = () => {
              if (!requirement?.geographic_focus) return 'Not specified';
              if (requirement.geographic_focus === 'SEAregion') return 'SEA Region';
              if (requirement.geographic_focus === 'KualaLumpur') return 'Kuala Lumpur';
              if (requirement.geographic_focus === 'EastMalaysia') return 'East Malaysia';
              if (requirement.geographic_focus === 'others')
                return requirement.geographicFocusOthers;
              return capitalizeFirstLetter(requirement.geographic_focus);
            };

            // Extracted renderAudienceContent for clarity and to avoid inline function
            function renderAudienceContent(isPrimary = true) {
              const prefix = isPrimary ? '' : 'secondary_';
              const gender = requirement?.[`${prefix}gender`];
              const age = requirement?.[`${prefix}age`];
              const country = requirement?.[`${prefix}country`];
              const language = requirement?.[`${prefix}language`];
              const creatorPersona = requirement?.[`${prefix}creator_persona`];
              const userPersona = requirement?.[`${prefix}user_persona`];

              return (
                <Stack className="body" justifyContent="space-between" direction="row" spacing={3}>
                  {/* Left Column */}
                  <Stack spacing={2} flex={1}>
                    <Box>
                      <Typography sx={SectionTitleStyle}>Gender</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {gender?.length > 0 ? (
                          gender.map((value, idx) => (
                            <Chip
                              key={idx}
                              label={capitalizeFirstLetter(value)}
                              size="small"
                              sx={ChipStyle}
                            />
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
                          age.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                          ))
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
                  </Stack>

                  {/* Right Column */}
                  <Stack spacing={2} flex={1}>
                    <Box>
                      <Typography sx={SectionTitleStyle}>Creator&apos;s Interests</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {creatorPersona?.length > 0 ? (
                          creatorPersona.map((value, idx) => (
                            <Chip
                              key={idx}
                              label={getProperInterestLabel(value)}
                              size="small"
                              sx={ChipStyle}
                            />
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
                      <Typography sx={SectionBodyStyle}>
                        {userPersona || 'Not specified'}
                      </Typography>
                    </Box>

                    {isPrimary && (
                      <Box>
                        <Typography sx={SectionTitleStyle}>Geographic Focus</Typography>
                        <Typography sx={SectionBodyStyle}>{getGeographicFocus()}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              );
            }

            if (hasSecondaryAudience) {
              return (
                <Stack direction="row" spacing={2}>
                  {/* PRIMARY AUDIENCE */}
                  <Box sx={BoxStyle}>
                    <Box className="header">
                      <Iconify
                        icon="material-symbols-light:groups-outline"
                        sx={{
                          color: '#FF3500',
                          width: 30,
                          height: 30,
                          mt: -0.7,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#221f20',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        PRIMARY AUDIENCE
                      </Typography>
                    </Box>
                    {renderAudienceContent(true)}
                  </Box>

                  {/* SECONDARY AUDIENCE */}
                  <Box sx={BoxStyle}>
                    <Box className="header">
                      <Iconify
                        icon="material-symbols-light:groups-outline"
                        sx={{
                          color: '#FF3500',
                          width: 30,
                          height: 30,
                          mt: -0.7,
                          mr: -0.2,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#221f20',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        SECONDARY AUDIENCE
                      </Typography>
                    </Box>
                    {renderAudienceContent(false)}
                  </Box>
                </Stack>
              );
            }

            return (
              <Box sx={BoxStyle}>
                <Box className="header">
                  <Iconify
                    icon="material-symbols-light:groups-outline"
                    sx={{
                      color: '#FF3500',
                      width: 30,
                      height: 30,
                      mt: -0.7,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    TARGET AUDIENCE
                  </Typography>
                </Box>
                {renderAudienceContent(true)}
              </Box>
            );
          })()}

          {/* ADDITIONAL DETAILS */}
          {(() => {
            const additionalDetails = campaign?.campaignAdditionalDetails;

            // Check if Additional Details 1 has any data
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

            // Check if Additional Details 2 has any data
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

            // Don't render if no data at all
            if (!hasAdditionalDetails1 && !hasAdditionalDetails2) {
              return null;
            }

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

            const renderAdditionalDetails1 = () => (
              <Stack className="body" spacing={3}>
                <Stack direction="row" spacing={2}>
                  {/* Left Column */}
                  <Stack spacing={2} flex={1}>
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
                    {(campaign?.campaignBrief?.postingStartDate ||
                      campaign?.campaignBrief?.postingEndDate) && (
                      <Box>
                        <Typography sx={SectionTitleStyle}>Posting Timeline</Typography>
                        <Typography sx={SectionBodyStyle}>{getPostingTimeline()}</Typography>
                      </Box>
                    )}
                    {additionalDetails?.mainMessage && (
                      <Box>
                        <Typography sx={SectionTitleStyle}>Main Message/Theme</Typography>
                        <Typography sx={SectionBodyStyle}>
                          {additionalDetails.mainMessage}
                        </Typography>
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
                  </Stack>

                  {/* Right Column */}
                  <Stack spacing={2} flex={1}>
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
                            <Typography
                              sx={{
                                ...SectionTitleStyle,
                                overflowWrap: 'anywhere',
                                whiteSpace: 'normal',
                              }}
                            >
                              Brand Guidelines Document{urls.length > 1 ? 's' : ''}
                            </Typography>
                            <Stack spacing={0.5}>
                              {urls.map((url, idx) => {
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
                                      whiteSpace: 'normal',
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
                        <Typography
                          sx={{
                            ...SectionTitleStyle,
                            overflowWrap: 'anywhere',
                            whiteSpace: 'normal',
                          }}
                        >
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
                            whiteSpace: 'normal',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {additionalDetails.referenceContent}
                        </Link>
                      </Box>
                    )}
                    {(additionalDetails?.productImage1Url ||
                      additionalDetails?.productImage2Url) && (
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
                </Stack>
              </Stack>
            );

            const renderAdditionalDetails2 = () => {
              const hasLeftColumnData =
                additionalDetails?.hashtagsToUse ||
                additionalDetails?.mentionsTagsRequired ||
                additionalDetails?.creatorCompensation ||
                additionalDetails?.ctaDesiredAction ||
                additionalDetails?.ctaLinkUrl;

              const leftColumnContent = (
                <>
                  {additionalDetails?.hashtagsToUse && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Hashtags</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.hashtagsToUse}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.mentionsTagsRequired && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Mentions/Tags Required</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.mentionsTagsRequired}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.creatorCompensation && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Creator Compensation</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.creatorCompensation}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.ctaDesiredAction && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Desired Action</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.ctaDesiredAction}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.ctaLinkUrl && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Link/URL</Typography>
                      <Link
                        href={normalizeUrl(additionalDetails.ctaLinkUrl)}
                        target="_blank"
                        sx={{
                          fontSize: '0.8rem',
                          color: '#203ff5',
                          textDecoration: 'none',
                          overflowWrap: 'anywhere',
                          whiteSpace: 'normal',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {additionalDetails.ctaLinkUrl}
                      </Link>
                    </Box>
                  )}
                </>
              );

              const rightColumnContent = (
                <>
                  {additionalDetails?.ctaPromoCode && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Promo Code</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.ctaPromoCode}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.ctaLinkInBioRequirements && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Link in Bio Requirements</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.ctaLinkInBioRequirements}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.specialNotesInstructions && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Special Notes/Instructions</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {additionalDetails.specialNotesInstructions}
                      </Typography>
                    </Box>
                  )}

                  {additionalDetails?.needAds && (
                    <Box>
                      <Typography sx={SectionTitleStyle}>Do you need ads?</Typography>
                      <Typography sx={SectionBodyStyle}>
                        {capitalizeFirstLetter(additionalDetails.needAds)}
                      </Typography>
                    </Box>
                  )}
                </>
              );

              return (
                <Stack className="body" spacing={3}>
                  <Stack direction="row" spacing={2}>
                    {hasLeftColumnData && (
                      <Stack spacing={2} flex={1}>
                        {leftColumnContent}
                      </Stack>
                    )}

                    <Stack spacing={2} flex={hasLeftColumnData ? 1 : undefined}>
                      {rightColumnContent}
                    </Stack>
                  </Stack>
                </Stack>
              );
            };

            // Render based on which sections have data
            if (hasAdditionalDetails1 && hasAdditionalDetails2) {
              return (
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                  {/* ADDITIONAL DETAILS 1 */}
                  <Box
                    sx={{
                      ...BoxStyle,
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box className="header">
                      <Iconify
                        icon="material-symbols:note-stack-add-outline"
                        sx={{
                          color: '#026D54',
                          width: 20,
                          height: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#221f20',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        ADDITIONAL DETAILS 1
                      </Typography>
                    </Box>
                    {renderAdditionalDetails1()}
                  </Box>

                  {/* ADDITIONAL DETAILS 2 */}
                  <Box
                    sx={{
                      ...BoxStyle,
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box className="header">
                      <Iconify
                        icon="material-symbols:note-stack-add-outline"
                        sx={{
                          color: '#026D54',
                          width: 20,
                          height: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#221f20',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        ADDITIONAL DETAILS 2
                      </Typography>
                    </Box>
                    {renderAdditionalDetails2()}
                  </Box>
                </Stack>
              );
            }

            // Single section - show whichever has data
            return (
              <Box sx={BoxStyle}>
                <Box className="header">
                  <Iconify
                    icon="material-symbols:note-stack-add-outline"
                    sx={{
                      color: '#026D54',
                      width: 20,
                      height: 20,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#221f20',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    ADDITIONAL DETAILS
                  </Typography>
                </Box>
                {hasAdditionalDetails1 ? renderAdditionalDetails1() : renderAdditionalDetails2()}
              </Box>
            );
          })()}
        </Stack>

        {/* Right Column */}
        <Stack sx={{ flex: { xs: 1, md: 1 }, minWidth: 0 }}>
          {/* DELIVERABLES */}
          <Box sx={{ ...BoxStyle, mt: 1 }}>
            <Box className="header">
              <Iconify
                icon="material-symbols:unarchive-outline"
                sx={{
                  color: '#203ff5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            <Box className="body" sx={{ display: 'flex', gap: 1 }}>
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
                        '&:hover': { bgcolor: '#F5F5F5' },
                      }}
                    />
                  )
              )}
            </Box>
          </Box>

          {/* LOGISTICS */}
          {campaign?.logisticsType && (
            <Box sx={{ ...BoxStyle, mt: 1 }}>
              <Box className="header">
                <Iconify
                  icon="material-symbols:inventory-2-outline-sharp"
                  sx={{
                    color: '#CFB5F6',
                    width: 20,
                    height: 20,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#221f20',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  LOGISTICS
                </Typography>
              </Box>
              <Box className="body" sx={{ display: 'flex', gap: 1 }}>
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
              </Box>
            </Box>
          )}

          {/* CAMPAIGN MANAGERS */}
          <Box sx={{ ...BoxStyle }}>
            <Box className="header">
              <Iconify
                icon="mdi:shield-person-outline"
                sx={{
                  color: '#026D54',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN MANAGER(S)
              </Typography>
            </Box>

            <Stack spacing={1} className="body">
              {campaign?.campaignAdmin?.map((elem) => (
                <Stack key={elem.id} direction="row" alignItems="center" spacing={1}>
                  <Avatar src={elem.admin.user.photoURL} sx={{ width: 34, height: 34 }} />
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {elem.admin.user.name}
                  </Typography>
                  {elem.admin.user.id === user.id ? (
                    <Chip
                      label="You"
                      sx={{
                        height: 32,
                        minWidth: 85,
                        bgcolor: '#f5f5f7',
                        color: '#8e8e93',
                        fontSize: '0.85rem',
                        fontWeight: 650,
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1,
                        '& .MuiChip-label': {
                          px: 1.5,
                          py: 2,
                        },
                        '&:hover': {
                          bgcolor: '#f5f5f7',
                        },
                      }}
                    />
                  ) : (
                    <Box
                      onClick={() => handleChatClick(elem.admin)}
                      sx={{
                        cursor: 'pointer',
                        px: 1.5,
                        py: 2,
                        minWidth: 85,
                        border: '1px solid #e7e7e7',
                        borderBottom: '3px solid #e7e7e7',
                        borderRadius: 1,
                        color: '#203ff5',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          bgcolor: 'rgba(32, 63, 245, 0.04)',
                        },
                      }}
                    >
                      Message
                    </Box>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* CLIENT INFO */}
          <Box sx={{ ...BoxStyle }}>
            <Box className="header">
              <Iconify
                icon="material-symbols:loyalty-outline"
                sx={{
                  color: '#FF9FBD',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
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
                  <Typography sx={{ ...SectionBodyStyle }}>
                    {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                  </Typography>
                </Stack>
              </Box>

              {/* Additional Company Info */}
              {[
                {
                  label: 'About',
                  value:
                    campaign?.brandAbout ||
                    campaign?.brand?.company?.about ||
                    campaign?.company?.about ||
                    'None',
                },
                {
                  label: 'Industry',
                  value: (() => {
                    // company.brand can be an array of brands, each with industries (array)
                    const brands = campaign?.company?.brand || campaign?.brand;
                    if (Array.isArray(brands)) {
                      // Flatten all industries from all brands, remove duplicates, and join
                      const allIndustries = brands
                        .flatMap((b) => (Array.isArray(b.industries) ? b.industries : []))
                        .filter(Boolean);
                      const uniqueIndustries = [...new Set(allIndustries)];
                      return uniqueIndustries.length > 0
                        ? uniqueIndustries.join(', ')
                        : 'Not specified';
                    }
                    return campaign?.campaignBrief.industries;
                  })(),
                },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography sx={SectionTitleStyle}>{item.label}</Typography>
                  <Typography sx={{ ...SectionBodyStyle }}>
                    {item.value || 'Not specified'}
                  </Typography>
                </Box>
              ))}

              {/* Add Divider */}
              <Box
                sx={{
                  height: '1px',
                  bgcolor: '#e0e0e0',
                  mx: -0.4, // margin left and right
                  my: 1, // margin top and bottom
                }}
              />

              {/* Continue with remaining items */}
              {[
                {
                  label: 'Company Address',
                  value: campaign?.company?.address || campaign?.brand?.company?.address,
                },
                {
                  label: 'Point of Contact: Name',
                  value:
                    campaign?.company?.pic?.[0]?.name || campaign?.brand?.company?.pic?.[0]?.name,
                },
                {
                  label: 'Point of Contact: Email',
                  value:
                    campaign?.company?.pic?.[0]?.email || campaign?.brand?.company?.pic?.[0]?.email,
                },
                {
                  label: 'Website',
                  value: campaign?.company?.website ?? campaign?.brand?.company?.website,
                  isLink: true,
                  href: (campaign?.company?.website ?? campaign?.brand?.website)?.startsWith('http')
                    ? (campaign?.company?.website ?? campaign?.brand?.website)
                    : `https://${campaign?.company?.website ?? campaign?.brand?.website}`,
                },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography sx={SectionTitleStyle}>{item.label}</Typography>
                  {item.isLink ? (
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: '0.8rem',
                        color: '#203ff5',
                        textDecoration: 'none',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'normal',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {item.value || 'Not specified'}
                    </Link>
                  ) : (
                    <Typography sx={{ ...SectionBodyStyle }}>
                      {item.value || 'Not specified'}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

CampaignDetailContentClient.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignDetailContentClient;
