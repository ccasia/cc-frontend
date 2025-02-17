/* eslint-disable no-nested-ternary */
import { useParams } from 'react-router';
import { useTheme } from '@emotion/react';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  alpha,
  Button,
  Avatar,
  Container,
  Typography,
  IconButton,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import { useRouter, useSearchParams } from 'src/routes/hooks';
import { useGetCampaignById } from 'src/routes/hooks/use-public-campaign';

import { useGetSubmissions } from 'src/hooks/use-get-submission';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
//  import { useGetCampaignById } from 'src/hooks/use-get-campaign-by-id';

//  import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';

import PublicSubmissionsView from './PublicSubmissionView';

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  height: 1,
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    mx: -3,
    mt: -1,
    mb: 2,
    pb: 1.5,
    pt: -1,
    px: 1.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const PublicManageCreatorView = () => {
  const { campaignId, creatorId } = useParams();

  //    const { mainRef } = useMainContext();
  const query = useSearchParams();

  const tabs = query.get('tabs');

  const [currentTab, setCurrentTab] = useState(tabs ?? 'profile');

  // const { socket } = useSocketContext();
  const { data, isLoading } = useGetCreatorById(creatorId);
  const { campaign, campaignLoading } = useGetCampaignById(campaignId);

  const theme = useTheme();

  const router = useRouter();

  const {
    data: submissions,
    isLoading: submissionLoading,
    mutate,
  } = useGetSubmissions(creatorId, campaignId);

  //    const { invoice } = useGetInvoiceByCreatorAndCampaign(id, campaignId);

  const isInvoiceGenerated = useMemo(() => {
    const firstSubmission = submissions?.find((item) => item.submissionType.type === 'FIRST_DRAFT');
    const finalSubmission = submissions?.find((item) => item.submissionType.type === 'FINAL_DRAFT');
    const postingSubmission = submissions?.find((item) => item.submissionType.type === 'POSTING');

    if (firstSubmission?.status === 'APPROVED') {
      return false;
    }

    if (finalSubmission?.status === 'APPROVED') {
      return false;
    }

    if (postingSubmission?.status === 'APPROVED') {
      return false;
    }

    return true;
  }, [submissions]);

  //   const generateInvoice = async () => {
  //     try {
  //       await axiosInstance.post(`/api/submission/generateInvoice`, {
  //         campaignId,
  //         userId: id,
  //       });
  //       enqueueSnackbar('Invoice has been successfully generated.');
  //     } catch (error) {
  //       enqueueSnackbar('Error generating invoice', {
  //         variant: 'error',
  //       });
  //     }
  //   };

  const renderTabs = (
    <Box sx={{ mt: 2.5, mb: 2.5 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            bgcolor: 'divider',
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            overflowX: 'auto',
          }}
        >
          {[
            { label: 'Overview', value: 'profile' },
            { label: 'Submissions', value: 'submission' },
            // { label: 'Invoice', value: 'invoice' },
            // { label: 'Logistics', value: 'logistics' },
            // { label: 'Timeline', value: 'timeline' },
          ].map((tab) => (
            <Button
              key={tab.value}
              disableRipple
              size="large"
              onClick={() => {
                router.push(`?tabs=${tab.value}`);
                // ha.set('tabs', tab.value);
                setCurrentTab(tab.value);
              }}
              sx={{
                px: { xs: 1, sm: 1.5 },
                py: 0.5,
                pb: 1,
                minWidth: 'fit-content',
                color: currentTab === tab.value ? '#221f20' : '#8e8e93',
                position: 'relative',
                fontSize: { xs: '0.9rem', sm: '1.05rem' },
                fontWeight: 650,
                whiteSpace: 'nowrap',
                mr: { xs: 1, sm: 2 },
                transition: 'transform 0.1s ease-in-out',
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'transparent',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  bgcolor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  width: currentTab === tab.value ? '100%' : '0%',
                  bgcolor: '#1340ff',
                  transition: 'all 0.3s ease-in-out',
                  transform: 'scaleX(1)',
                  transformOrigin: 'left',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '&::after': {
                    width: '100%',
                    opacity: currentTab === tab.value ? 1 : 0.5,
                  },
                },
                // mr: 2,
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  );

  // const shortlistedCreators = useMemo(
  //   () =>
  //     !campaignLoading && campaign?.shortlisted
  //       ? campaign.shortlisted.map((item, index) => ({ index, userId: item?.userId }))
  //       : [],
  //   [campaign, campaignLoading]
  // );

  // const currentIndex = shortlistedCreators.find((a) => a?.userId === id)?.index;

  //   useEffect(() => {
  //     if (socket) {
  //       socket.on('newSubmission', () => {
  //         mutate();
  //       });
  //     }

  //     return () => {
  //       socket?.off('newSubmission');
  //     };
  //   }, [socket, mutate]);

  //   useEffect(() => {
  //     if (!mainRef.current) return;

  //     mainRef?.current.scrollTo({
  //       top: 0,
  //       behavior: 'smooth', // Optional for smooth scrolling
  //     });
  //   }, [mainRef]);

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 2, sm: 5 },
        pt: { xs: 2, sm: 5 },
      }}
    >
      <Button
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
        // onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(campaign?.id))}
        onClick={() => router.push(`/public/view/${campaignId}`)}
        sx={{
          alignSelf: 'flex-start',
          color: '#636366',
          fontSize: { xs: '0.875rem', sm: '1rem' },
        }}
      >
        Back
      </Button>

      {(isLoading || submissionLoading || campaignLoading) && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}

      {!campaignLoading && (
        <>
          {/* Profile Info - Now without card wrapper */}
          <Box sx={{ p: 3, mb: -2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Avatar
                alt={data?.user?.name}
                src={data?.user?.photoURL}
                sx={{
                  width: 48,
                  height: 48,
                  ml: -2,
                  border: '1px solid #e7e7e7',
                }}
              >
                {data?.user?.name?.charAt(0).toUpperCase()}
              </Avatar>

              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'Instrument Serif',
                  flex: 1,
                  ml: 2,
                  fontWeight: 580,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {`${data?.user?.name?.charAt(0).toUpperCase()}${data?.user?.name?.slice(1)}`}
                <Box
                  component="img"
                  src="/assets/icons/overview/creatorVerified.svg"
                  sx={{
                    width: 20,
                    height: 20,
                    ml: 0.5,
                  }}
                />
              </Typography>

              <Stack direction="row" spacing={1}>
                {data?.user?.creator?.instagram && (
                  <IconButton
                    component="a"
                    href={`https://instagram.com/${data?.user?.creator?.instagram}`}
                    target="_blank"
                    sx={{
                      color: '#636366',
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha('#636366', 0.08),
                      },
                    }}
                  >
                    <Iconify icon="mdi:instagram" width={24} />
                  </IconButton>
                )}
                {data?.user?.creator?.tiktok && (
                  <IconButton
                    component="a"
                    href={`https://tiktok.com/@${data?.user?.creator?.tiktok}`}
                    target="_blank"
                    sx={{
                      color: '#636366',
                      border: '1px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha('#636366', 0.08),
                      },
                    }}
                  >
                    <Iconify icon="ic:baseline-tiktok" width={24} />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Tabs */}
          {renderTabs}

          {currentTab === 'profile' && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} px={{ md: 3 }}>
              {/* Stats Section */}
              <Box
                sx={{
                  // width: { xs: '100%', sm: '80%', md: '50%', lg: '35%' },
                  border: '1px solid #e7e7e7',
                  borderRadius: 2,
                  p: 3,
                  ml: { xs: 0, sm: -3 },
                  // bgcolor: 'background.paper',
                }}
              >
                <Stack spacing={3}>
                  {/* Stats Groups */}
                  <Stack spacing={2}>
                    {/* Followers */}
                    <Stack direction="row" spacing={2}>
                      <Box
                        component="img"
                        src="/assets/icons/overview/purpleGroup.svg"
                        sx={{ width: 32, height: 32, alignSelf: 'center' }}
                      />
                      <Stack>
                        <Typography variant="h6">N/A</Typography>
                        <Typography variant="subtitle2" color="#8e8e93" sx={{ fontWeight: 500 }}>
                          Followers
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Engagement Rate */}
                    <Stack direction="row" spacing={2}>
                      <Box
                        component="img"
                        src="/assets/icons/overview/greenChart.svg"
                        sx={{ width: 32, height: 32, alignSelf: 'center' }}
                      />
                      <Stack>
                        <Typography variant="h6">N/A</Typography>
                        <Typography variant="subtitle2" color="#8e8e93" sx={{ fontWeight: 500 }}>
                          Engagement Rate
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Average Likes */}
                    <Stack direction="row" spacing={2}>
                      <Box
                        component="img"
                        src="/assets/icons/overview/bubbleHeart.svg"
                        sx={{ width: 32, height: 32, alignSelf: 'center' }}
                      />
                      <Stack>
                        <Typography variant="h6">N/A</Typography>
                        <Typography variant="subtitle2" color="#8e8e93" sx={{ fontWeight: 500 }}>
                          Average Likes
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>

                  {/* Divider */}
                  <Box sx={{ borderTop: '1px solid #e7e7e7' }} />

                  {/* Personal Information */}
                  <Stack spacing={3}>
                    {[
                      {
                        label: 'Pronouns',
                        value: data?.user?.creator?.pronounce,
                        fallback: 'Not specified',
                      },
                      {
                        label: 'Email',
                        value: data?.user?.email,
                        fallback: 'Not specified',
                      },
                      {
                        label: 'Phone',
                        value: data?.user?.phoneNumber,
                        fallback: 'Not specified',
                      },
                      {
                        label: 'Location',
                        value: data?.user?.creator?.country || data?.user?.country,
                        fallback: 'Not specified',
                      },
                      {
                        label: 'Interests',
                        value: data?.user?.creator?.interests?.map((interest) => (
                          <Box
                            key={interest.name}
                            component="span"
                            sx={{
                              display: 'inline-block',
                              color: '#8e8e93',
                              border: '1px solid #ebebeb',
                              borderBottom: '3px solid #ebebeb',
                              fontWeight: 600,
                              px: 1,
                              py: 0.5,
                              borderRadius: 0.8,
                              mr: 0.5,
                              mb: 0.5,
                              textTransform: 'uppercase',
                              fontSize: '0.8rem',
                            }}
                          >
                            {interest.name}
                          </Box>
                        )),
                        fallback: 'Not specified',
                      },
                    ].map((item) => (
                      <Stack key={item.label} spacing={1}>
                        <Typography
                          variant="subtitle2"
                          color="#8e8e93"
                          sx={{ fontWeight: 600, mt: -0.5 }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: 'break-word',
                            display: item.label === 'Interests' ? 'flex' : 'block',
                            flexWrap: 'wrap',
                            gap: 0.5,
                          }}
                        >
                          {item.value || item.fallback}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ ...BoxStyle }}>
                <Box className="header">
                  <img
                    src="/assets/icons/overview/bluesmileyface.svg"
                    alt="Campaign Info"
                    style={{
                      width: 20,
                      height: 20,
                      color: '#203ff5',
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
                    Payment Information
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <ListItemText
                    primary="Account Name"
                    secondary={data?.user?.paymentForm?.bankAccountName || 'N/A'}
                    primaryTypographyProps={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      mt: -0.5,
                      variant: 'subtitle2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'black',
                    }}
                  />

                  <ListItemText
                    primary="Bank Name"
                    secondary={data?.user?.paymentForm?.bankName || 'N/A'}
                    primaryTypographyProps={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      mt: -0.5,
                      variant: 'subtitle2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'black',
                    }}
                  />

                  <ListItemText
                    primary="Account Number"
                    secondary={data?.user?.paymentForm?.bankAccountNumber || 'N/A'}
                    primaryTypographyProps={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      mt: -0.5,
                      variant: 'subtitle2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'black',
                    }}
                  />

                  <ListItemText
                    primary="IC/Passport Number"
                    secondary={data?.user?.paymentForm?.icNumber || 'N/A'}
                    primaryTypographyProps={{
                      color: '#8e8e93',
                      fontWeight: 600,
                      mt: -0.5,
                      variant: 'subtitle2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      color: 'black',
                    }}
                  />
                </Stack>
              </Box>
            </Stack>
          )}

          {currentTab === 'submission' && !submissionLoading && (
            <PublicSubmissionsView
              campaign={campaign}
              submissions={submissions}
              creator={data}
              // invoice={invoice}
            />
          )}
          {/* {currentTab === 'logistics' && <LogisticView campaign={campaign} creator={data} />} */}

          {/* {currentTab === 'invoice' && invoice ? (
            <PDFViewer width="100%" height={600} style={{ border: 'none', borderRadius: 10 }}>
              <InvoicePDF invoice={invoice} />
            </PDFViewer>
          ) : null} */}

          {/* {currentTab === 'invoice' && !invoice ? (
            <EmptyContent
              title="No invoice found"
              description="This creator has not been invoiced yet."
            />
          ) : null} */}

          {/* {currentTab === 'timeline' && <TimelineCreator campaign={campaign} creator={data} />} */}
        </>
      )}
    </Container>
  );
};

export default PublicManageCreatorView;

// PublicManageCreatorView.propTypes = {
//   id: PropTypes.string,
//   //  campaignId: PropTypes.string,
// };
