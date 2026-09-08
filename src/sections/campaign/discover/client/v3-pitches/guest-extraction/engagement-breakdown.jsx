import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import PostThumb from './post-thumb';
import { CC, FIELD_RADIUS, labelSx } from './creator-field-tokens';

/**
 * How the engagement rate was reached.
 *
 * Laid out on the same grey paper + white panels as Add Non-Platform Creators.
 * Numbers come from the stored per-post evidence. The formula sentence is keyed
 * on `formulaVersion`; an unknown version prints its name instead of guessing.
 */

export const FORMULA_COPY = {
  instagram_recent_5_followers_v1: {
    title: 'Instagram, 5 most recent posts',
    formula: '100 × (mean of likes + comments) ÷ followers',
    denominator: 'followers',
  },
  tiktok_recent_5_mean_view_rate_v1: {
    title: 'TikTok, 5 most recent posts',
    formula: '100 × mean of ((likes + comments + shares) ÷ views)',
    denominator: 'perPostViews',
  },
  instagram_recent_10_median_view_v2: {
    title: 'Instagram, 10 most recent Reels',
    formula: '100 × (mean of likes + comments) ÷ median views',
    denominator: 'medianViews',
  },
  tiktok_recent_10_median_view_v2: {
    title: 'TikTok, 10 most recent posts',
    formula: '100 × (mean of likes + comments + saves + shares) ÷ median views',
    denominator: 'medianViews',
  },
};

export function describeFormula(formulaVersion) {
  return (
    FORMULA_COPY[formulaVersion] ?? {
      title: 'Engagement rate',
      // Never invent an explanation for a formula this build does not know.
      formula: formulaVersion ? `Formula ${formulaVersion}` : 'Formula not recorded',
      denominator: null,
    }
  );
}

const isNum = (value) => typeof value === 'number' && Number.isFinite(value);
const number = (value) => (isNum(value) ? value.toLocaleString() : '—');

/** Always dd/mm/yy from the UTC calendar day on the stored ISO time. */
export function shortDate(iso) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  const dd = String(parsed.getUTCDate()).padStart(2, '0');
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(parsed.getUTCFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

const captionOf = (post) => {
  if (typeof post?.caption !== 'string') return null;
  const trimmed = post.caption.trim();
  return trimmed || null;
};

/** Total engagement of one post. An unreported counter adds nothing. */
const totalEngagement = (post) =>
  post.likes +
  post.comments +
  (isNum(post.saves) ? post.saves : 0) +
  (isNum(post.shares) ? post.shares : 0);

/** Even counts take the mean of the two middle values, as the backend does. */
export function medianOf(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const bodyFont = 'Inter Display, Inter, sans-serif';

const panelSx = {
  bgcolor: '#FFFFFF',
  borderRadius: `${FIELD_RADIUS}px`,
  border: `1px solid ${CC.light100}`,
  p: 2,
};

const cellSx = {
  fontFamily: bodyFont,
  fontSize: '14px',
  fontWeight: 400,
  lineHeight: '18px',
  color: CC.onyx,
  py: '10px',
  borderBottom: `1px solid ${CC.light100}`,
  verticalAlign: 'middle',
};
const headSx = {
  ...cellSx,
  ...labelSx,
  fontSize: '12px !important',
  py: '8px',
  whiteSpace: 'nowrap',
  borderBottom: `1px solid ${CC.light100}`,
  bgcolor: '#FFFFFF',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const linkSx = {
  color: CC.blue500,
  fontWeight: 600,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
};

/** One summary value. The rate is the answer, so it carries the blue. */
function MetricTile({ label, value, emphasize }) {
  return (
    <Box
      sx={{
        flex: emphasize ? 1.15 : 1,
        minWidth: 0,
        bgcolor: '#FFFFFF',
        border: `1px solid ${emphasize ? CC.blue500 : CC.light100}`,
        borderRadius: `${FIELD_RADIUS}px`,
        px: '12px',
        py: '10px',
      }}
    >
      <Typography component="div" sx={{ ...labelSx, mb: '4px' }}>
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontFamily: bodyFont,
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '20px',
          color: emphasize ? CC.blue500 : CC.onyx,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

MetricTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  emphasize: PropTypes.bool,
};

export default function EngagementBreakdown({
  posts,
  formulaVersion,
  engagementRate,
  followerCount,
}) {
  const list = Array.isArray(posts) ? posts : [];
  const { denominator } = describeFormula(formulaVersion);

  // Show only what the formula used. The v1 Instagram formula divided by the
  // follower count, so its view counts played no part and stay out.
  const hasRate = list.some((post) => isNum(post.ratePercent));
  const hasShares = list.some((post) => isNum(post.shares));
  const hasSaves = list.some((post) => isNum(post.saves));
  const hasViews = denominator !== 'followers' && list.some((post) => isNum(post.views));
  const hasLinks = list.some((post) => typeof post.postUrl === 'string' && post.postUrl);

  const byMedian = denominator === 'medianViews';
  const views = list.filter((post) => isNum(post.views)).map((post) => post.views);
  const meanEngagement =
    list.length > 0
      ? list.reduce((sum, post) => sum + totalEngagement(post), 0) / list.length
      : null;
  const medianViews = views.length > 0 ? medianOf(views) : null;

  const columns = [
    ['Likes', (post) => number(post.likes)],
    ['Comments', (post) => number(post.comments)],
    hasSaves && ['Saves', (post) => number(post.saves)],
    hasShares && ['Shares', (post) => number(post.shares)],
    hasViews && ['Views', (post) => number(post.views)],
    hasRate && [
      'Rate',
      (post) => (isNum(post.ratePercent) ? `${post.ratePercent.toFixed(2)}%` : '—'),
    ],
  ].filter(Boolean);

  const summaryTiles = [
    {
      label: 'Engagement rate',
      value: `${engagementRate || '—'}%`,
      emphasize: true,
    },
    byMedian &&
      isNum(meanEngagement) && {
        label: 'Average total engagement',
        value: meanEngagement.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      },
    byMedian &&
      isNum(medianViews) && {
        label: 'Median views',
        value: medianViews.toLocaleString(),
      },
    denominator === 'followers' &&
      isNum(followerCount) && {
        label: 'Followers',
        value: followerCount.toLocaleString(),
      },
  ].filter(Boolean);

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        {summaryTiles.map((tile) => (
          <MetricTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            emphasize={tile.emphasize}
          />
        ))}
      </Stack>

      {list.length === 0 ? (
        <Box sx={panelSx}>
          <Typography sx={{ fontSize: '13px', color: CC.grey50 }}>
            No per-post detail was stored for this result.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ ...panelSx, p: 0, maxHeight: '46vh', overflowY: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ ...headSx, textAlign: 'left', pl: 2, pr: 1 }}>
                  Post
                </Box>
                {columns.map(([label]) => (
                  <Box
                    key={label}
                    component="th"
                    sx={{ ...headSx, textAlign: 'right', pl: 1, pr: 2 }}
                  >
                    {label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {list.map((post, index) => {
                const caption = captionOf(post);
                const rowBorder = index === list.length - 1 ? 'none' : `1px solid ${CC.light100}`;
                const dateLabel = shortDate(post.publishedAt);
                const postInner = (
                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                    <PostThumb postUrl={post.postUrl} />
                    <Box sx={{ minWidth: 0 }}>
                      <Box
                        component="span"
                        sx={{
                          ...(post.postUrl ? linkSx : { color: CC.onyx, fontWeight: 600 }),
                          whiteSpace: 'nowrap',
                          fontSize: '13px',
                          lineHeight: '18px',
                        }}
                      >
                        {dateLabel}
                      </Box>
                      {caption && (
                        <Typography
                          title={caption}
                          sx={{
                            mt: '1px',
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: CC.grey50,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {caption}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                );

                return (
                  <Box
                    component="tr"
                    key={post.postId ?? index}
                    sx={{
                      '&:hover td': { bgcolor: CC.light25 },
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        ...cellSx,
                        textAlign: 'left',
                        pl: 2,
                        pr: 1,
                        maxWidth: 320,
                        borderBottom: rowBorder,
                      }}
                    >
                      {post.postUrl ? (
                        <Box
                          component="a"
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                        >
                          {postInner}
                        </Box>
                      ) : (
                        postInner
                      )}
                    </Box>
                    {columns.map(([label, read]) => (
                      <Box
                        key={label}
                        component="td"
                        sx={{
                          ...cellSx,
                          textAlign: 'right',
                          pl: 1,
                          pr: 2,
                          whiteSpace: 'nowrap',
                          borderBottom: rowBorder,
                        }}
                      >
                        {read(post)}
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      <Stack spacing={0.5}>
        {hasLinks && (
          <Typography sx={{ fontSize: '12px', lineHeight: '16px', color: CC.grey25 }}>
            Each post opens in a new tab.
          </Typography>
        )}
        {byMedian && !hasSaves && (
          <Typography sx={{ fontSize: '12px', lineHeight: '16px', color: CC.grey25 }}>
            Saves are not reported by this source, so they are not part of this rate.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

EngagementBreakdown.propTypes = {
  posts: PropTypes.array,
  formulaVersion: PropTypes.string,
  engagementRate: PropTypes.string,
  followerCount: PropTypes.number,
};
