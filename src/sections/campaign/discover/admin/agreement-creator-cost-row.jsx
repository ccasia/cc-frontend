import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Insta', icon: 'mdi:instagram', color: '#D6249F' },
  { value: 'tiktok', label: 'TikTok', icon: 'ic:baseline-tiktok', color: '#000000' },
];

export function getFollowerCountByPlatform(creatorRow, platform) {
  const shortlisted = creatorRow?.user?.shortlisted?.[0] || creatorRow?.shortlistedCreator;
  if ((shortlisted?.selectedPlatform || 'instagram') === platform && shortlisted?.followerCount) {
    return Number(shortlisted.followerCount) || 0;
  }

  const creatorData = creatorRow?.user?.creator || creatorRow?.creator;
  if (!creatorData) return 0;

  if (platform === 'tiktok') {
    return creatorData.tiktokUser?.follower_count || creatorData.manualTiktokFollowerCount || 0;
  }
  return creatorData.instagramUser?.followers_count || creatorData.manualInstagramFollowerCount || 0;
}

// Matches the same minFollowers/maxFollowers tier resolution used everywhere else in this
// codebase (campaign-agreement-edit.jsx, backend creditTierService.ts).
export function resolveTierForFollowerCount(creditTierList, followerCount) {
  if (!Array.isArray(creditTierList) || !followerCount || followerCount <= 0) return null;
  const matched = creditTierList.filter(
    (tier) =>
      tier?.isActive &&
      tier?.minFollowers <= followerCount &&
      (tier?.maxFollowers === null || tier?.maxFollowers >= followerCount)
  );
  if (!matched.length) return null;
  return matched.sort((a, b) => (b?.minFollowers || 0) - (a?.minFollowers || 0))[0];
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    borderRadius: 1,
    '& fieldset': { borderColor: '#E3E3E3' },
  },
};

const blockArrowKeys = (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
};

// One row per selected creator inside the "Send Additional Agreement" modal: identity,
// platform toggle, tier readout, video count, payment amount, and a product-seeding switch
// (visual only for now). `rowState` is controlled by the parent:
// { selectedPlatform, videoCount, amount, productSeeding }.
export default function AgreementCreatorCostRow({ creatorRow, campaign, creditTierList, rowState, onChange, error }) {
  const { selectedPlatform, videoCount, amount, productSeeding } = rowState;
  const resolvedFollowerCount = getFollowerCountByPlatform(creatorRow, selectedPlatform);
  const tier = campaign?.isCreditTier ? resolveTierForFollowerCount(creditTierList, resolvedFollowerCount) : null;
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
          <Box
            sx={{
              display: 'flex',
              bgcolor: '#E7E7E7',
              borderRadius: '12px',
              p: '3px',
            }}
          >
            {PLATFORM_OPTIONS.map((platform) => {
              const isActive = selectedPlatform === platform.value;
              return (
                <Box
                  key={platform.value}
                  component="button"
                  type="button"
                  onClick={() => onChange({ ...rowState, selectedPlatform: platform.value })}
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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

        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography sx={{ color: '#221f20', fontSize: '0.9rem' }}>Payment Amount</Typography>
          <TextField
            type="number"
            size="small"
            value={amount ?? ''}
            placeholder="RM"
            inputProps={{ min: 0 }}
            onChange={(e) => onChange({ ...rowState, amount: e.target.value })}
            onKeyDown={blockArrowKeys}
            sx={fieldSx}
          />
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

      {campaign?.isCreditTier && resolvedFollowerCount <= 0 && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          No follower count on record for {selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram'} — connect their
          media kit or set a follower count manually to price this round.
        </Typography>
      )}
      {campaign?.isCreditTier && resolvedFollowerCount > 0 && !tier && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          No credit tier matches {resolvedFollowerCount.toLocaleString()} followers.
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

AgreementCreatorCostRow.propTypes = {
  creatorRow: PropTypes.object.isRequired,
  campaign: PropTypes.object,
  creditTierList: PropTypes.array,
  rowState: PropTypes.shape({
    selectedPlatform: PropTypes.string,
    videoCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productSeeding: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
