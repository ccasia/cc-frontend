import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Link,
  Chip,
  List,
  Stack,
  Avatar,
  Divider,
  ListItem,
  Typography,
  ListItemIcon,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { MultiFilePreview } from 'src/components/upload';

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
    p: 2.5
  }
};

const CompactHeaderStyle = {
  ...BoxStyle,
  '& .header': {
    ...BoxStyle['& .header'],
    pb: 1.5,
    minHeight: 'auto',
  },
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  if (string.toLowerCase() === 'f&b') return 'F&B';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const CampaignDetailContentClient = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  console.log('Campaign details: ', campaign)

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
        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 2.5 } }}>
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

            <Stack spacing={2} className='body'>
              <Box>
                <Typography variant="subtitle2" color="#8E8E93">
                  Product / Service Name
                </Typography>
                <Typography variant="body2">
                  {campaign?.productName || 'No product/service name.'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="#8E8E93">
                  Campaign Info
                </Typography>
                <Typography variant="body2">
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
            
            <Stack className='body' justifyContent="space-between" direction="row" spacing={2}>
              <Stack spacing={2} flex={1}>
                <Box>
                  <Typography variant="subtitle2" color="#8E8E93">
                    Primary Campaign Objective
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {campaign?.campaignBrief?.objectives ? (
                      <Chip 
                        label={campaign.campaignBrief.objectives} 
                        size="small" 
                        sx={ChipStyle} 
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not specified
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="#8E8E93">
                    Secondary Campaign Objective
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {campaign?.campaignBrief?.secondaryObjectives?.length > 0 ? (
                      campaign.campaignBrief.secondaryObjectives.map((objective, idx) => (
                        <Chip 
                          key={idx} 
                          label={objective} 
                          size="small" 
                          sx={ChipStyle} 
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not specified
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>

              <Stack spacing={2} flex={1}>
                <Box>
                  <Typography variant="subtitle2" color="#8E8E93">
                    Promote Content
                  </Typography>
                  <Typography variant="body2">
                    {campaign?.campaignBrief?.boostContent 
                      ? capitalizeFirstLetter(campaign.campaignBrief.boostContent)
                      : 'Not specified'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="#8E8E93">
                    Primary KPI
                  </Typography>
                  <Typography variant="body2">
                    {campaign?.campaignBrief?.primaryKPI || 'Not specified'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="#8E8E93">
                    Current Performance Baseline
                  </Typography>
                  <Typography variant="body2">
                    {campaign?.campaignBrief?.performanceBaseline || 'Not specified'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
          
          {/* TARGET AUDIENCE SECTION */}
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
              if (requirement.geographic_focus === 'SEARegion') return 'SEA Region';
              return capitalizeFirstLetter(requirement.geographic_focus);
            };

            // Extracted renderAudienceContent for clarity and to avoid inline function
            function renderAudienceContent(isPrimary = true) {
              const prefix = isPrimary ? '' : 'secondary_';
              const gender = requirement?.[`${prefix}gender`];
              const age = requirement?.[`${prefix}age`];
              const country = requirement?.[`${prefix}country`];
              const geoLocation = requirement?.[`${prefix}geoLocation`];
              const language = requirement?.[`${prefix}language`];
              const creatorPersona = requirement?.[`${prefix}creator_persona`];
              const userPersona = requirement?.[`${prefix}user_persona`];

              return (
                <Stack className='body' justifyContent="space-between" direction="row" spacing={3}>
                  {/* Left Column */}
                  <Stack spacing={2} flex={1}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        Gender
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {gender?.length > 0 ? (
                          gender.map((value, idx) => (
                            <Chip key={idx} label={capitalizeFirstLetter(value)} size="small" sx={ChipStyle} />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">Not specified</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        Age
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {age?.length > 0 ? (
                          age.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">Not specified</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        Country
                      </Typography>
                      {country ? (
                        <Box display="inline-flex" gap={1} sx={{ ...ChipStyle, p: 1, px: 1.5 }} alignItems="center">
                          <Iconify icon={`emojione:flag-for-${country.toLowerCase()}`} width={20} />
                          <Typography variant="subtitle2">{country}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not specified</Typography>
                      )}
                    </Box>

                    {geoLocation?.length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                          Geo Location
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {geoLocation.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        Language
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {language?.length > 0 ? (
                          language.map((value, idx) => (
                            <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">Not specified</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>

                  {/* Right Column */}
                  <Stack spacing={2} flex={1}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        Creator&apos;s Interests
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {creatorPersona?.length > 0 ? (
                          creatorPersona.map((value, idx) => (
                            <Chip 
                              key={idx} 
                              label={value.toLowerCase() === 'f&b' ? 'F&B' : capitalizeFirstLetter(value)} 
                              size="small" 
                              sx={ChipStyle} 
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">Not specified</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        User Persona
                      </Typography>
                      <Typography variant="body2">
                        {userPersona || 'Not specified'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                        Geographic Focus
                      </Typography>
                      <Typography variant="body2">
                        {getGeographicFocus()}
                      </Typography>
                    </Box>
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
                          mr: -0.2
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
        </Stack>

        {/* Right Column */}
        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 1 } }}>
          {/* Deliverables Box */}
          <Box sx={{ ...BoxStyle, mt: 0.9 }}>
            <Box className="header">
              <Iconify
                icon="solar:box-bold"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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

          {/* Campaign Admin Box */}
          <Box sx={{ ...CompactHeaderStyle }}>
            <Box className="header">
              <Iconify
                icon="solar:user-bold"
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
                  fontSize: '0.8rem',
                  lineHeight: 1,
                }}
              >
                CAMPAIGN MANAGER(S)
              </Typography>
            </Box>

            <Stack spacing={1}>
              {campaign?.campaignAdmin?.map((elem) => (
                <Stack
                  key={elem.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ py: 0.75 }}
                >
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

          {/* Client Info Box */}
          <Box sx={CompactHeaderStyle}>
            <Box className="header">
              <Iconify
                icon="solar:buildings-bold"
                sx={{
                  color: '#1340ff',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  lineHeight: 1,
                }}
              >
                CLIENT INFO
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Client Info */}
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
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                  </Typography>
                </Stack>
              </Box>

              {/* Additional Company Info */}
              {[
                {
                  label: 'About',
                  value: campaign?.company?.about || campaign?.brand?.about || 'None',
                },
                { label: 'Brand Tone', value: campaign?.brandTone },
                { label: 'Product / Service Name', value: campaign?.productName },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
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
                  label: 'Email',
                  value: campaign?.company?.email || campaign?.brand?.email || 'None',
                },
                {
                  label: 'Website',
                  value: campaign?.company?.website ?? campaign?.brand?.website,
                  isLink: true,
                  href: (campaign?.company?.website ?? campaign?.brand?.website)?.startsWith('http')
                    ? (campaign?.company?.website ?? campaign?.brand?.website)
                    : `https://${campaign?.company?.website ?? campaign?.brand?.website}`,
                },
                {
                  label: 'Instagram',
                  value: campaign?.company?.instagram ?? campaign?.brand?.instagram,
                },
                { label: 'TikTok', value: campaign?.company?.tiktok ?? campaign?.brand?.tiktok },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                  >
                    {item.label}
                  </Typography>
                  {item.isLink ? (
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: '0.9rem',
                        color: '#203ff5',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {item.value || 'Not specified'}
                    </Link>
                  ) : (
                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                      {item.value || 'Not specified'}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Agreement Form Box is intentionally removed for client users */}

          {/* Other Attachments Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:folder-bold"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                OTHER ATTACHMENTS
              </Typography>
            </Box>
            {campaign?.campaignBrief?.otherAttachments?.length > 0 ? (
              <MultiFilePreview files={campaign?.campaignBrief?.otherAttachments} thumbnail />
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                No attachments
              </Typography>
            )}
          </Box>

          {/* Reference Links Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="eva:link-2-outline"
                sx={{
                  color: '#203ff5',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                REFERENCE LINKS
              </Typography>
            </Box>

            {campaign?.campaignBrief?.referencesLinks?.length > 0 ? (
              <List>
                {campaign?.campaignBrief?.referencesLinks?.map((link, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Iconify icon="ix:reference" />
                    </ListItemIcon>
                    <Link key={index} href={link} target="_blank">
                      {link}
                    </Link>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No references found.
              </Typography>
            )}
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
