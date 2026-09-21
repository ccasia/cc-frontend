import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Grid, FieldLabel, InputAdornment, Divider } from '@mui/material';

import Iconify from 'src/components/iconify';

import {
  getFollowerCountByPlatform,
  resolveTierForFollowerCount,
} from './agreement-creator-cost-row';
import { NumericFormat } from 'react-number-format';
import { Controller, useFormContext } from 'react-hook-form';
import { RHFTextField } from 'src/components/hook-form';
import { CURRENCY_PREFIXES } from 'src/utils/currency';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Insta', icon: 'mdi:instagram', color: '#D6249F' },
  { value: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok', color: '#000000' },
];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    borderRadius: 1,
    '& fieldset': { borderColor: '#E3E3E3' },
  },
};

// Up/Down would otherwise silently nudge the value while typing or tabbing through the form —
// block them on every numeric field in this row instead.
const blockArrowKeys = (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
};

// One row per selected (not-yet-sent) creator inside the "Send Bulk Agreement" modal — same
// identity/platform/tier shell as AgreementCreatorCostRow, plus the Currency and Follower Count
// fields a *first* agreement needs to price/generate that a later round doesn't (platform and
// follower count are already on record by the time a creator gets an additional round).
export default function BulkAgreementCreatorRow({
  creatorRow,
  campaign,
  creditTierList,
  rowState,
  onChange,
  error,
}) {
  const { selectedPlatform, currency, followerCount, amount, videoCount, productSeeding } =
    rowState;

  const { control, setValue } = useFormContext();
  // console.log(selectedPlatform, currency, followerCount, amount, videoCount, productSeeding);
  const detectedFollowerCount = getFollowerCountByPlatform(creatorRow, selectedPlatform);
  const effectiveFollowerCount = Number(followerCount) || 0;
  const tier = campaign?.isCreditTier
    ? resolveTierForFollowerCount(creditTierList, effectiveFollowerCount)
    : null;
  const activePlatform =
    PLATFORM_OPTIONS.find((p) => p.value === selectedPlatform) || PLATFORM_OPTIONS[0];

  const isSeedingAgreement = true;

  return (
    <Box sx={{ padding: '20px 40px' }}>
      <Grid container spacing={2}>
        {/* User Info & Platform Selection */}
        <Grid item xs={12} alignSelf="center">
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              flexDirection={{ xs: 'column', sm: 'row' }}
              spacing={1}
            >
              <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
                <Avatar src={agreement?.user?.photoURL} />
                <Stack width={150}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontFamily: 'Inter Tight, sans-serif',
                      textTransform: 'capitalize',
                      fontWeight: 400,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {agreement?.user?.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontFamily: 'Inter Tight, sans-serif',
                      fontWeight: 400,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {agreement?.user?.email}
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                sx={{
                  flex: 1,
                  justifyContent: 'flex-start',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                }}
              >
                <Tabs
                  value={selectedPlatform}
                  onChange={(_, val) => {
                    setSelectedPlatform(val);
                    setValue(
                      'platformFollowerCount',
                      String(getFollowerCountByPlatform(val) || ''),
                      { shouldValidate: true }
                    );
                  }}
                  variant="fullWidth"
                  TabIndicatorProps={{
                    children: <span />,
                    sx: {
                      height: 1,
                      py: 1,
                      zIndex: -1,
                      padding: '4px',
                      transition: 'all .3s ease-in-out',
                      bgcolor: 'transparent',
                      '&.MuiTabs-indicator > span': {
                        bgcolor: 'rgba(255, 255, 255, 1)',
                        borderColor: 'rgba(255, 255, 255, 1)',
                        width: '100%',
                        height: '100%',
                        display: 'inline-flex',
                        borderRadius: 1,
                        border: '1px solid #E8E8E8',
                      },
                    },
                  }}
                  sx={{
                    borderRadius: 1.5,
                    m: 1,
                    '&.MuiTabs-root': {
                      position: 'relative',
                      zIndex: 1,
                      minHeight: 'auto',
                      flexShrink: 0,
                      bgcolor: 'rgba(231, 231, 231, 1)',
                      flex: 1,
                      width: { xs: 1, sm: 200 },
                    },
                    '& .MuiTabs-scroller': {
                      p: '0px',
                    },
                  }}
                >
                  {PLATFORM_OPTIONS.map((platform, index) => (
                    <Tab
                      key={index}
                      label={platform.label}
                      value={platform.value}
                      iconPosition="start"
                      icon={<Iconify icon={platform.icon} width={16} />}
                      sx={{
                        '&.Mui-selected': {
                          borderRadius: 2,
                          fontWeight: 600,
                        },
                        '&:not(.Mui-selected)': {
                          color: '#8E8E93',
                        },
                        '&:not(:last-of-type)': {
                          mr: 0,
                        },
                      }}
                    />
                  ))}
                </Tabs>

                {campaign?.isCreditTier && displayTierData && (
                  <Stack direction="column" ml={2}>
                    <Box
                      sx={{
                        py: 0.5,
                        flexShrink: 1,
                        borderRadius: 0.8,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Iconify
                        icon={
                          selectedPlatform === 'tiktok' ? 'ic:baseline-tiktok' : 'mdi:instagram'
                        }
                        width={14}
                        sx={{
                          color: selectedPlatform === 'tiktok' ? '#000000' : '#E4405F',
                          flexShrink: 0,
                        }}
                      />
                      {displayTierData.name}
                    </Box>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        border: '1px solid #EBEBEB',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {displayTierData.creditsPerVideo} credits/video
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>
        </Grid>

        {/* Product Name */}
        {isSeedingAgreement && (
          <Grid item xs={12} sm={6}>
            <Box>
              <FieldLabel>Product Name</FieldLabel>
              <RHFTextField
                name="product.name"
                placeholder="Eg. Philip OneBlade"
                sx={{ mt: 1 }}
                InputProps={{
                  sx: {
                    bgcolor: '#FFF',
                  },
                }}
              />
            </Box>
          </Grid>
        )}

        {/* Product Value & Payment Amount */}
        {isSeedingAgreement ? (
          <Grid item xs={12} sm={6}>
            <Box>
              <FieldLabel>Product Value</FieldLabel>
              <Controller
                name="product.value"
                control={control}
                render={({ field }) => (
                  <NumericFormat
                    {...field}
                    customInput={RHFTextField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 1 }}>
                          <RHFSelect
                            name="currency"
                            onChange={(e) =>
                              setValue('currency', e.target.value, { shouldValidate: true })
                            }
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            sx={{
                              '& .MuiSelect-select': {
                                pr: '30px !important',
                              },
                              '& .MuiSelect-standard': {
                                ml: 2,
                                fontSize: 13,
                                fontWeight: 600,
                              },
                            }}
                          >
                            {Object.keys(CURRENCY_PREFIXES).map((curr) => (
                              <MenuItem key={curr} value={curr}>
                                {curr}
                              </MenuItem>
                            ))}
                          </RHFSelect>
                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ height: 20, alignSelf: 'center' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    allowNegative={false}
                    thousandSeparator
                    decimalScale={2}
                    fixedDecimalScale
                    onChange={undefined}
                    onValueChange={(value) => {
                      setValue('product.value', value.floatValue);
                    }}
                    prefix={
                      CURRENCY_PREFIXES[selectedCurrency]?.prefix
                        ? `${CURRENCY_PREFIXES[selectedCurrency].prefix} `
                        : ''
                    }
                    placeholder={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} 350`}
                    variant="outlined"
                    isAllowed={(val) => {
                      const { value } = val;
                      if (value.length && Number(value[0]) === 0) return false;
                      return true;
                    }}
                    sx={{
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        pl: 0,
                        bgcolor: '#FFF',
                      },
                    }}
                  />
                )}
              />
            </Box>
          </Grid>
        ) : (
          <Grid item xs={12} sm={6}>
            <Box>
              <FieldLabel>Payment Amount</FieldLabel>
              <Controller
                name="paymentAmount"
                control={control}
                render={({ field }) => (
                  <NumericFormat
                    {...field}
                    customInput={RHFTextField}
                    onChange={undefined}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 1 }}>
                          <RHFSelect
                            name="currency"
                            onChange={(e) =>
                              setValue('currency', e.target.value, { shouldValidate: true })
                            }
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            PaperPropsSx={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none',
                              '&::-webkit-scrollbar': {
                                display: 'none',
                              },
                            }}
                            sx={{
                              '& .MuiSelect-select': {
                                pr: '30px !important',
                              },
                              '& .MuiSelect-standard': {
                                fontSize: 13,
                                fontWeight: 600,
                              },
                            }}
                          >
                            {Object.keys(CURRENCY_PREFIXES).map((curr) => (
                              <MenuItem
                                key={curr}
                                value={curr}
                                sx={{
                                  width: 80,
                                  justifyContent: 'center',
                                }}
                              >
                                {curr}
                              </MenuItem>
                            ))}
                          </RHFSelect>
                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ height: 20, alignSelf: 'center' }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    allowNegative={false}
                    thousandSeparator
                    decimalScale={2}
                    fixedDecimalScale
                    onValueChange={(value) => {
                      setValue('paymentAmount', value.floatValue);
                    }}
                    prefix={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} ` ?? ''}
                    placeholder={`${CURRENCY_PREFIXES[selectedCurrency]?.prefix} 350`}
                    variant="outlined"
                    isAllowed={(val) => {
                      const { value } = val;
                      if (value.length && Number(value[0]) === 0) return false;
                      return true;
                    }}
                    sx={{
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        bgcolor: '#FFF',
                      },
                    }}
                  />
                )}
              />
            </Box>
          </Grid>
        )}

        {/* Follower count */}
        <Grid item xs={12} sm={6}>
          <Box>
            <FieldLabel>Follower Count</FieldLabel>
            <Controller
              name="platformFollowerCount"
              control={control}
              render={({ field }) => (
                <NumericFormat
                  {...field}
                  customInput={RHFTextField}
                  allowNegative={false}
                  onValueChange={(value) => {
                    setValue('platformFollowerCount', value.floatValue);
                  }}
                  placeholder="2021"
                  variant="outlined"
                  isAllowed={(val) => {
                    const { value } = val;
                    if (value.length && Number(value[0]) === 0) return false;
                    return true;
                  }}
                  sx={{
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      bgcolor: '#FFF',
                    },
                  }}
                />
              )}
            />
          </Box>

          <Box mt={1}>
            {mediaKitFollower > 0 && effectiveFollowerCountForTier !== mediaKitFollower && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: '#637381',
                  px: 0.25,
                  wordWrap: 'break-word',
                }}
              >
                Their {platformLabel} media kit says{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {mediaKitFollower.toLocaleString()}
                </Box>{' '}
                followers. This agreement is priced on{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {effectiveFollowerCountForTier.toLocaleString()}
                </Box>{' '}
                followers.
              </Typography>
            )}
            {!canEditFollowerCount && (
              <Typography variant="caption" sx={{ color: '#637381', px: 0.25 }}>
                Using the {platformLabel} follower count already on record for this creator.
              </Typography>
            )}
            {campaign?.isCreditTier && effectiveFollowerCountForTier <= 0 && (
              <Typography variant="caption" sx={{ color: 'error.main', px: 0.25 }}>
                Enter a {platformLabel} follower count to price this agreement.
              </Typography>
            )}
            {campaign?.isCreditTier && effectiveFollowerCountForTier > 0 && !displayTierData && (
              <Typography
                // variant="caption"
                sx={{
                  color: 'error.main',
                  px: 0.25,
                  wordBreak: 'break-word',
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                No credit tier matches the selected platform follower count.
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Credits amount */}
        <Grid item xs={12} sm={6}>
          {requiresUGCCredits && (
            <Box>
              <FieldLabel>{campaign?.isCreditTier ? 'Video Amount' : 'UGC Credits'}</FieldLabel>

              <Controller
                name="ugcCredits"
                control={control}
                render={({ field }) => (
                  <NumericFormat
                    {...field}
                    customInput={RHFTextField}
                    allowNegative={false}
                    onValueChange={(value) => {
                      setValue('ugcCredits', value.floatValue);
                    }}
                    placeholder="2"
                    variant="outlined"
                    isAllowed={(val) => {
                      const { floatValue, value } = val;
                      if (floatValue === undefined) return true;

                      if (maxCreditsAllowed === null) return true;

                      if (value.length && Number(value[0]) === 0) return false;

                      return floatValue <= maxCreditsAllowed;
                    }}
                    sx={{
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        bgcolor: '#FFF',
                      },
                    }}
                  />
                )}
              />

              <Box sx={{ my: 1 }} />
              {campaign?.campaignCredits !== null && (
                <CreditsStatusBanner
                  creatorCost={creatorCost}
                  realTimeCreditsLeft={realTimeCreditsLeft}
                  isCreditTier={campaign?.isCreditTier}
                />
              )}
            </Box>
          )}
        </Grid>

        {/* Seeding toggle */}
        <Grid item xs={12}>
          <Stack
            sx={{
              border: 1,
              borderRadius: 1.2,
              borderColor: (theme) => theme.palette.divider,
              pl: 2,
              height: 52,
              bgcolor: '#FFF',
            }}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <FieldLabel>Enable Product Seeding?</FieldLabel>
            <RHFSwitch
              name="isSeedingAgreement"
              labelPlacement="start"
              edge="end"
              sx={{
                width: '100%',
                justifyContent: 'space-between',
                ml: 0,
                '& .Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#1340FF !important',
                },
              }}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );

  // return (
  //   <Stack sx={{ py: 2.5 }} spacing={2}>
  //     <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
  //       <Stack direction="row" alignItems="center" spacing={1.5}>
  //         <Avatar
  //           src={creatorRow?.user?.photoURL}
  //           alt={creatorRow?.user?.name}
  //           sx={{ width: 40, height: 40 }}
  //         >
  //           {creatorRow?.user?.name?.charAt(0).toUpperCase()}
  //         </Avatar>
  //         <Stack>
  //           <Typography sx={{ fontWeight: 500, color: '#221f20' }}>
  //             {creatorRow?.user?.name}
  //           </Typography>
  //           <Typography sx={{ color: '#6B7280', fontSize: '0.9rem' }}>
  //             {creatorRow?.user?.email}
  //           </Typography>
  //         </Stack>
  //       </Stack>

  //       <Stack direction="row" alignItems="center" spacing={2}>
  //         <Box sx={{ display: 'flex', bgcolor: '#E7E7E7', borderRadius: '12px', p: '3px' }}>
  //           {PLATFORM_OPTIONS.map((platform) => {
  //             const isActive = selectedPlatform === platform.value;
  //             return (
  //               <Box
  //                 key={platform.value}
  //                 component="button"
  //                 type="button"
  //                 onClick={() =>
  //                   onChange({
  //                     ...rowState,
  //                     selectedPlatform: platform.value,
  //                     followerCount: String(
  //                       getFollowerCountByPlatform(creatorRow, platform.value) || ''
  //                     ),
  //                   })
  //                 }
  //                 sx={{
  //                   display: 'flex',
  //                   alignItems: 'center',
  //                   gap: 0.5,
  //                   height: 30,
  //                   px: 1.25,
  //                   border: 'none',
  //                   borderRadius: '9px',
  //                   bgcolor: isActive ? '#fff' : 'transparent',
  //                   color: isActive ? '#221f20' : '#9CA3AF',
  //                   fontSize: '0.78rem',
  //                   fontWeight: isActive ? 700 : 500,
  //                   cursor: 'pointer',
  //                   transition: 'background-color 0.15s ease, color 0.15s ease',
  //                 }}
  //               >
  //                 <Iconify
  //                   icon={platform.icon}
  //                   width={14}
  //                   sx={{ color: isActive ? platform.color : '#9CA3AF' }}
  //                 />
  //                 {platform.label}
  //               </Box>
  //             );
  //           })}
  //         </Box>

  //         {campaign?.isCreditTier && (
  //           <Stack sx={{ minWidth: 65, ml: 3 }}>
  //             <Stack direction="row" alignItems="center" spacing={0.5}>
  //               <Iconify
  //                 icon={activePlatform.icon}
  //                 width={14}
  //                 sx={{ color: activePlatform.color }}
  //               />
  //               <Typography sx={{ fontWeight: 500, fontSize: '0.78rem', color: '#221f20' }}>
  //                 {tier ? tier.name : 'No tier'}
  //               </Typography>
  //             </Stack>
  //             {tier && (
  //               <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
  //                 {tier.creditsPerVideo} Credit{tier.creditsPerVideo !== 1 ? 's' : ''}
  //               </Typography>
  //             )}
  //           </Stack>
  //         )}
  //       </Stack>
  //     </Stack>

  //     <Stack spacing={0.75}>
  //       <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>
  //         Enable Product Seeding?
  //       </Typography>
  //       <Switch
  //         size="small"
  //         checked={!!productSeeding}
  //         onChange={(e) => onChange({ ...rowState, productSeeding: e.target.checked })}
  //         sx={{
  //           ml: -1,
  //           '& .Mui-checked': { color: '#1340FF' },
  //           '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#1340FF !important' },
  //         }}
  //       />
  //     </Stack>

  //     <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
  //       <Stack spacing={0.75} sx={{ flex: 1 }}>
  //         <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Currency</Typography>
  //         <TextField
  //           select
  //           size="small"
  //           value={currency || 'MYR'}
  //           onChange={(e) => onChange({ ...rowState, currency: e.target.value })}
  //           sx={fieldSx}
  //         >
  //           <MenuItem value="MYR">MYR</MenuItem>
  //           <MenuItem value="SGD">SGD</MenuItem>
  //           <MenuItem value="AUD">AUD</MenuItem>
  //           <MenuItem value="USD">USD</MenuItem>
  //         </TextField>
  //       </Stack>

  //       <Stack spacing={0.75} sx={{ flex: 1 }}>
  //         <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Payment Amount</Typography>
  //         <TextField
  //           type="number"
  //           size="small"
  //           value={amount ?? ''}
  //           placeholder="0"
  //           inputProps={{ min: 0 }}
  //           onChange={(e) => onChange({ ...rowState, amount: e.target.value })}
  //           onKeyDown={blockArrowKeys}
  //           sx={fieldSx}
  //         />
  //       </Stack>
  //     </Stack>

  //     <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
  //       <Stack spacing={0.75} sx={{ flex: 1 }}>
  //         <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Follower Count</Typography>
  //         <TextField
  //           type="number"
  //           size="small"
  //           value={followerCount ?? ''}
  //           placeholder={detectedFollowerCount ? String(detectedFollowerCount) : '0'}
  //           inputProps={{ min: 0 }}
  //           onChange={(e) =>
  //             onChange({ ...rowState, followerCount: e.target.value.replace(/[^0-9]/g, '') })
  //           }
  //           onKeyDown={blockArrowKeys}
  //           sx={fieldSx}
  //         />
  //       </Stack>

  //       <Stack spacing={0.75} sx={{ flex: 1 }}>
  //         <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Video Amount</Typography>
  //         <TextField
  //           type="number"
  //           size="small"
  //           value={videoCount ?? ''}
  //           placeholder="0"
  //           inputProps={{ min: 0 }}
  //           onChange={(e) => onChange({ ...rowState, videoCount: e.target.value })}
  //           onKeyDown={blockArrowKeys}
  //           sx={fieldSx}
  //         />
  //       </Stack>
  //     </Stack>

  //     {campaign?.isCreditTier && effectiveFollowerCount <= 0 && (
  //       <Typography variant="caption" sx={{ color: 'error.main' }}>
  //         Enter a follower count to price this agreement.
  //       </Typography>
  //     )}
  //     {campaign?.isCreditTier && effectiveFollowerCount > 0 && !tier && (
  //       <Typography variant="caption" sx={{ color: 'error.main' }}>
  //         No credit tier matches {effectiveFollowerCount.toLocaleString()} followers.
  //       </Typography>
  //     )}
  //     {error && (
  //       <Typography variant="caption" sx={{ color: '#D4321C' }}>
  //         {error}
  //       </Typography>
  //     )}
  //   </Stack>
  // );
}

BulkAgreementCreatorRow.propTypes = {
  creatorRow: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  creditTierList: PropTypes.array,
  rowState: PropTypes.shape({
    selectedPlatform: PropTypes.string,
    currency: PropTypes.string,
    followerCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    videoCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productSeeding: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
