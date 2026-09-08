import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { getFollowerCountByPlatform, resolveTierForFollowerCount } from './agreement-creator-cost-row';

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
export default function BulkAgreementCreatorRow({ creatorRow, campaign, creditTierList, rowState, onChange, error }) {
  const { selectedPlatform, currency, followerCount, amount, videoCount, productSeeding } = rowState;
  const detectedFollowerCount = getFollowerCountByPlatform(creatorRow, selectedPlatform);
  const effectiveFollowerCount = Number(followerCount) || 0;
  const tier = campaign?.isCreditTier ? resolveTierForFollowerCount(creditTierList, effectiveFollowerCount) : null;
  const activePlatform = PLATFORM_OPTIONS.find((p) => p.value === selectedPlatform) || PLATFORM_OPTIONS[0];

  return (
    <Stack sx={{ py: 2.5 }} spacing={2}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar src={creatorRow?.user?.photoURL} alt={creatorRow?.user?.name} sx={{ width: 40, height: 40 }}>
            {creatorRow?.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Stack>
            <Typography sx={{ fontWeight: 500, color: '#221f20' }}>{creatorRow?.user?.name}</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.9rem' }}>{creatorRow?.user?.email}</Typography>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ display: 'flex', bgcolor: '#E7E7E7', borderRadius: '12px', p: '3px' }}>
            {PLATFORM_OPTIONS.map((platform) => {
              const isActive = selectedPlatform === platform.value;
              return (
                <Box
                  key={platform.value}
                  component="button"
                  type="button"
                  onClick={() =>
                    onChange({
                      ...rowState,
                      selectedPlatform: platform.value,
                      followerCount: String(getFollowerCountByPlatform(creatorRow, platform.value) || ''),
                    })
                  }
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    height: 30,
                    px: 1.25,
                    border: 'none',
                    borderRadius: '9px',
                    bgcolor: isActive ? '#fff' : 'transparent',
                    color: isActive ? '#221f20' : '#9CA3AF',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  <Iconify icon={platform.icon} width={14} sx={{ color: isActive ? platform.color : '#9CA3AF' }} />
                  {platform.label}
                </Box>
              );
            })}
          </Box>

          {campaign?.isCreditTier && (
            <Stack sx={{ minWidth: 65, ml: 3 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon={activePlatform.icon} width={14} sx={{ color: activePlatform.color }} />
                <Typography sx={{ fontWeight: 500, fontSize: '0.78rem', color: '#221f20' }}>
                  {tier ? tier.name : 'No tier'}
                </Typography>
              </Stack>
              {tier && (
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                  {tier.creditsPerVideo} Credit{tier.creditsPerVideo !== 1 ? 's' : ''}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack spacing={0.75}>
        <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Enable Product Seeding?</Typography>
        <Switch
          size="small"
          checked={!!productSeeding}
          onChange={(e) => onChange({ ...rowState, productSeeding: e.target.checked })}
          sx={{
            ml: -1,
            '& .Mui-checked': { color: '#1340FF' },
            '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#1340FF !important' },
          }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Currency</Typography>
          <TextField
            select
            size="small"
            value={currency || 'MYR'}
            onChange={(e) => onChange({ ...rowState, currency: e.target.value })}
            sx={fieldSx}
          >
            <MenuItem value="MYR">MYR</MenuItem>
            <MenuItem value="SGD">SGD</MenuItem>
            <MenuItem value="AUD">AUD</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </TextField>
        </Stack>

        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Payment Amount</Typography>
          <TextField
            type="number"
            size="small"
            value={amount ?? ''}
            placeholder="0"
            inputProps={{ min: 0 }}
            onChange={(e) => onChange({ ...rowState, amount: e.target.value })}
            onKeyDown={blockArrowKeys}
            sx={fieldSx}
          />
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Follower Count</Typography>
          <TextField
            type="number"
            size="small"
            value={followerCount ?? ''}
            placeholder={detectedFollowerCount ? String(detectedFollowerCount) : '0'}
            inputProps={{ min: 0 }}
            onChange={(e) => onChange({ ...rowState, followerCount: e.target.value.replace(/[^0-9]/g, '') })}
            onKeyDown={blockArrowKeys}
            sx={fieldSx}
          />
        </Stack>

        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Video Amount</Typography>
          <TextField
            type="number"
            size="small"
            value={videoCount ?? ''}
            placeholder="0"
            inputProps={{ min: 0 }}
            onChange={(e) => onChange({ ...rowState, videoCount: e.target.value })}
            onKeyDown={blockArrowKeys}
            sx={fieldSx}
          />
        </Stack>
      </Stack>

      {campaign?.isCreditTier && effectiveFollowerCount <= 0 && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          Enter a follower count to price this agreement.
        </Typography>
      )}
      {campaign?.isCreditTier && effectiveFollowerCount > 0 && !tier && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          No credit tier matches {effectiveFollowerCount.toLocaleString()} followers.
        </Typography>
      )}
      {error && (
        <Typography variant="caption" sx={{ color: '#D4321C' }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
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
