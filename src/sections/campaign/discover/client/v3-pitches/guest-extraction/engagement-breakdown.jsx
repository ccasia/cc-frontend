import PropTypes from 'prop-types';
import { useId, useState } from 'react';
import { m, MotionConfig } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import SavedPostPreview from 'src/sections/discovery-tool/components/SavedPostPreview';

import { CC, labelSx } from './creator-field-tokens';

/**
 * How the engagement rate was reached.
 *
 * A summary card puts the rate beside a small chart of views per post, so a
 * viral post that lifts the rate is visible at once. Below it, every post the
 * rate used is a card with its saved thumbnail, the same copy Discovery shows.
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

/**
 * Always dd/mm/yy from the UTC calendar day on the stored ISO time.
 *
 * Null for an Instagram Reel whose publish date the provider did not expose.
 * `new Date(null)` is the epoch, so without the guard it renders 01/01/70.
 */
export function shortDate(iso) {
  if (!iso) return '—';
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
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** A post this far above the median views is marked, because it lifts the mean. */
export const OUTLIER_FACTOR = 5;

const serif = 'Instrument Serif, serif';

const noteSx = { fontSize: '12px', lineHeight: '16px', color: CC.grey25 };

const fixed = (value, digits) => value.toLocaleString(undefined, { maximumFractionDigits: digits });

const panelSx = {
  bgcolor: '#FFFFFF',
  borderRadius: '16px',
  border: `1px solid ${CC.light100}`,
};

/** Each counter a post card can show. The icon's tooltip names it. */
const METRICS = {
  likes: { label: 'Likes', icon: 'lucide:heart' },
  comments: { label: 'Comments', icon: 'lucide:message-circle' },
  saves: { label: 'Saves', icon: 'lucide:bookmark' },
  shares: { label: 'Shares', icon: 'lucide:send' },
  rate: { label: 'Rate', icon: 'lucide:trending-up' },
};

const CHART_HEIGHT = 72;
/** Room above the tallest bar for its value label. */
const CHART_HEADROOM = 18;
/** Right gutter that holds the median label, clear of every bar. */
const CHART_GUTTER = 92;
/** Both pass the dataviz palette check on white (lightness, chroma, CVD, 3:1). */
const OUTLIER_BAR = CC.blue500;
const NORMAL_BAR = '#6F86FF';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Axis end label: month and year from the UTC date, like `Aug '26`. */
const monthLabel = (iso) => {
  const parsed = iso ? new Date(iso) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  return `${MONTHS[parsed.getUTCMonth()]} '${String(parsed.getUTCFullYear()).slice(-2)}`;
};

/** Figures in the brand serif: open and easy to read, unlike the tight sans digits. */
const figureSx = { fontFamily: serif, fontWeight: 400, letterSpacing: '0.01em', color: CC.onyx };

/** One input of the rate on one row: icon chip, what it is, then the value. */
function Fact({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: '8px',
          bgcolor: CC.light25,
          color: CC.grey50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Iconify icon={icon} width={15} />
      </Box>
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '13px',
          lineHeight: '20px',
          color: CC.grey50,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ ...figureSx, fontSize: '24px', lineHeight: '24px' }}>{value}</Typography>
    </Stack>
  );
}

Fact.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

/** Hover card for one bar: the post, its date and its views. */
function BarTip({ post }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box sx={{ width: 36, height: 48, flexShrink: 0, borderRadius: '6px', overflow: 'hidden' }}>
        <SavedPostPreview thumbnailUrl={post.thumbnailUrl} postUrl={post.postUrl} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '11px', lineHeight: '14px', color: CC.grey50 }}>
          {shortDate(post.publishedAt)}
        </Typography>
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography sx={{ ...figureSx, fontSize: '20px', lineHeight: '24px' }}>
            {post.views.toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: CC.grey50 }}>views</Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

BarTip.propTypes = {
  post: PropTypes.object.isRequired,
};

/** A light card instead of the default dark tooltip, to match the modal. */
const barTipProps = {
  tooltip: {
    sx: {
      p: 1.25,
      maxWidth: 260,
      bgcolor: '#FFFFFF',
      color: CC.onyx,
      border: `1px solid ${CC.light100}`,
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
    },
  },
  arrow: {
    sx: {
      color: '#FFFFFF',
      '&::before': { border: `1px solid ${CC.light100}` },
    },
  },
};

/**
 * Views per post, oldest on the left, on a log scale so a 2k post and a 1.4M
 * post both show. The dashed line is the median the rate divides by, labelled
 * in its own gutter so it never sits on a bar. Only the tallest bar carries a
 * value; hover any column for the post. The plot grows to fill its panel.
 */
export function ViewsChart({ posts, medianViews }) {
  const dated = posts.filter((post) => isNum(post.views) && post.views > 0).reverse();
  if (dated.length === 0) return null;

  const values = dated.map((post) => post.views);
  const peak = Math.max(...values);
  const lo = Math.log10(Math.min(...values, medianViews) / 2);
  const hi = Math.log10(Math.max(peak, medianViews));
  const scale = (value) => ((Math.log10(value) - lo) / (hi - lo || 1)) * 100;
  const medianPct = scale(medianViews);
  const hasOutlier = values.some((value) => value >= medianViews * OUTLIER_FACTOR);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Iconify icon="lucide:chart-column" width={15} sx={{ color: CC.grey50 }} />
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: CC.onyx }}>
            Views per post
          </Typography>
        </Stack>
        {hasOutlier && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: OUTLIER_BAR }} />
            <Typography sx={{ ...noteSx, color: CC.grey50 }}>
              {`${OUTLIER_FACTOR}× median or more`}
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Plot. Fills the rest of the panel; bars and median share one frame. */}
      <Box sx={{ position: 'relative', flex: 1, minHeight: CHART_HEIGHT + CHART_HEADROOM }}>
        <Box
          sx={{
            position: 'absolute',
            top: CHART_HEADROOM,
            bottom: 0,
            left: 0,
            right: CHART_GUTTER,
            borderBottom: `1px solid ${CC.light100}`,
          }}
        >
          <Stack direction="row" alignItems="stretch" sx={{ height: 1 }}>
            {dated.map((post, index) => {
              const outlier = post.views >= medianViews * OUTLIER_FACTOR;
              const height = Math.max(scale(post.views), 3);
              return (
                <Tooltip
                  key={post.postId ?? index}
                  arrow
                  placement="top"
                  enterDelay={0}
                  // Touch opens on a tap, not MUI's default long press.
                  enterTouchDelay={0}
                  leaveTouchDelay={4000}
                  componentsProps={barTipProps}
                  title={<BarTip post={post} />}
                >
                  {/* The whole column is the hit target, wider than the bar. */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      '&:hover .bar': { filter: 'brightness(0.88)' },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 28,
                        mx: '3px',
                        height: `${height}%`,
                      }}
                    >
                      {post.views === peak && (
                        <Typography
                          sx={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            mb: '2px',
                            ...figureSx,
                            fontSize: '15px',
                            lineHeight: '16px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {compact.format(post.views)}
                        </Typography>
                      )}
                      <Box
                        className="bar"
                        sx={{
                          width: 1,
                          height: 1,
                          borderRadius: '4px 4px 0 0',
                          bgcolor: outlier ? OUTLIER_BAR : NORMAL_BAR,
                          transition: 'filter 0.15s',
                        }}
                      />
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>

          {/* Median rule across the plot, and its label in the gutter. */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              right: -8,
              bottom: `${medianPct}%`,
              borderTop: `1px dashed ${CC.grey50}`,
              pointerEvents: 'none',
            }}
          />
          <Typography
            sx={{
              position: 'absolute',
              left: 'calc(100% + 12px)',
              bottom: `${medianPct}%`,
              transform: 'translateY(50%)',
              fontSize: '12px',
              lineHeight: '16px',
              color: CC.grey50,
              whiteSpace: 'nowrap',
            }}
          >
            Median{' '}
            <Box component="span" sx={{ ...figureSx, fontSize: '15px' }}>
              {compact.format(medianViews)}
            </Box>
          </Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: '6px', mr: `${CHART_GUTTER}px` }}
      >
        <Typography sx={noteSx}>{monthLabel(dated[0].publishedAt)}</Typography>
        {/* All posts in one month: say it once. */}
        {monthLabel(dated[dated.length - 1].publishedAt) !== monthLabel(dated[0].publishedAt) && (
          <Typography sx={noteSx}>{monthLabel(dated[dated.length - 1].publishedAt)}</Typography>
        )}
      </Stack>
    </Box>
  );
}

ViewsChart.propTypes = {
  posts: PropTypes.array.isRequired,
  medianViews: PropTypes.number.isRequired,
};

function Stat({ metric, value }) {
  const { label, icon } = METRICS[metric];
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} title={label} aria-label={label}>
      <Iconify icon={icon} width={13} sx={{ color: CC.grey50, flexShrink: 0 }} />
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        {value}
      </Box>
    </Stack>
  );
}

Stat.propTypes = {
  metric: PropTypes.oneOf(Object.keys(METRICS)).isRequired,
  value: PropTypes.node.isRequired,
};

/**
 * A gallery tile, like a profile grid: the cover carries the views, the line
 * under it the caption, date and the other counters. No box around it.
 */
export function PostCard({ post, metaMetrics, showViews }) {
  const caption = captionOf(post);
  const linked = Boolean(post.postUrl);

  const inner = (
    <>
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '3 / 4',
          borderRadius: '12px',
          overflow: 'hidden',
          bgcolor: CC.light100,
        }}
      >
        <Box
          className="post-media"
          sx={{ width: 1, height: 1, transition: 'transform 0.25s ease' }}
        >
          <SavedPostPreview thumbnailUrl={post.thumbnailUrl} postUrl={post.postUrl} />
        </Box>
        {showViews && (
          <>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                top: '55%',
                pointerEvents: 'none',
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              title="Views"
              aria-label="Views"
              sx={{ position: 'absolute', left: 10, bottom: 8, color: '#FFFFFF' }}
            >
              <Iconify icon="lucide:play" width={13} />
              <Box component="span" sx={{ fontSize: '13px', lineHeight: '18px', fontWeight: 600 }}>
                {number(post.views)}
              </Box>
            </Stack>
          </>
        )}
      </Box>

      <Box sx={{ pt: 1, px: '2px' }}>
        <Typography
          title={caption ?? undefined}
          sx={{
            fontSize: '13px',
            lineHeight: '18px',
            fontWeight: 500,
            color: caption ? CC.onyx : CC.grey25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {caption ?? 'No caption'}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          columnGap={1.25}
          rowGap={0.25}
          sx={{
            mt: '4px',
            flexWrap: 'wrap',
            fontSize: '12px',
            lineHeight: '16px',
            color: CC.grey50,
          }}
        >
          <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
            {shortDate(post.publishedAt)}
          </Box>
          {metaMetrics.map(([metric, read]) => (
            <Stat key={metric} metric={metric} value={read(post)} />
          ))}
        </Stack>
      </Box>
    </>
  );

  const shellSx = { display: 'block', minWidth: 0, textDecoration: 'none', color: 'inherit' };

  if (!linked) return <Box sx={shellSx}>{inner}</Box>;

  return (
    <Box
      component="a"
      href={post.postUrl}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        ...shellSx,
        borderRadius: '12px',
        '&:hover .post-media': { transform: 'scale(1.04)' },
        '&:focus-visible': { outline: `2px solid ${CC.blue500}`, outlineOffset: 3 },
      }}
    >
      {inner}
    </Box>
  );
}

PostCard.propTypes = {
  post: PropTypes.object.isRequired,
  metaMetrics: PropTypes.array.isRequired,
  showViews: PropTypes.bool,
};

/** Motion shared by the sort pill and the cards, so they move as one. */
const SPRING = { type: 'spring', stiffness: 520, damping: 42, mass: 0.8 };

/**
 * Segmented sort control. One white pill slides under the active option
 * instead of each option switching its own background.
 */
function SortControl({ options, value, onChange }) {
  const pillId = useId();
  return (
    <Stack
      direction="row"
      spacing={0.25}
      role="group"
      aria-label="Sort posts"
      sx={{ p: '3px', borderRadius: '10px', bgcolor: CC.light100 }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <ButtonBase
            key={option.value}
            disableRipple
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            sx={{
              position: 'relative',
              px: 1.25,
              height: 28,
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              color: active ? CC.onyx : CC.grey50,
              transition: 'color 0.2s ease',
              '&:hover': { color: CC.onyx },
              '&:focus-visible': { outline: `2px solid ${CC.blue500}`, outlineOffset: 1 },
            }}
          >
            {active && (
              <Box
                component={m.span}
                layoutId={pillId}
                transition={SPRING}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                }}
              />
            )}
            <Box component="span" sx={{ position: 'relative' }}>
              {option.label}
            </Box>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

SortControl.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

/**
 * The counters under each post card. Views lead the card itself; a counter no
 * post reports is left out.
 */
export function metaMetricsFor(list) {
  const hasRate = list.some((post) => isNum(post.ratePercent));
  const hasShares = list.some((post) => isNum(post.shares));
  const hasSaves = list.some((post) => isNum(post.saves));
  return [
    ['likes', (post) => number(post.likes)],
    ['comments', (post) => number(post.comments)],
    hasSaves && ['saves', (post) => number(post.saves)],
    hasShares && ['shares', (post) => number(post.shares)],
    hasRate && [
      'rate',
      (post) => (isNum(post.ratePercent) ? `${post.ratePercent.toFixed(2)}%` : '—'),
    ],
  ].filter(Boolean);
}

export default function EngagementBreakdown({
  posts,
  formulaVersion,
  engagementRate,
  followerCount,
}) {
  const [sortBy, setSortBy] = useState('newest');
  const list = Array.isArray(posts) ? posts : [];
  const { denominator } = describeFormula(formulaVersion);

  // Show only what the formula used. The v1 Instagram formula divided by the
  // follower count, so its view counts played no part and stay out.
  const hasViews = denominator !== 'followers' && list.some((post) => isNum(post.views));

  const byMedian = denominator === 'medianViews';
  const views = list.filter((post) => isNum(post.views)).map((post) => post.views);
  const meanEngagement =
    list.length > 0
      ? list.reduce((sum, post) => sum + totalEngagement(post), 0) / list.length
      : null;
  const medianViews = views.length > 0 ? medianOf(views) : null;

  const hasSaves = list.some((post) => isNum(post.saves));
  const metaMetrics = metaMetricsFor(list);

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    hasViews && { value: 'views', label: 'Most views' },
  ].filter(Boolean);
  const activeSort = sortOptions.some((option) => option.value === sortBy) ? sortBy : 'newest';

  let shown = list;
  if (activeSort === 'views') shown = [...list].sort((a, b) => (b.views ?? -1) - (a.views ?? -1));

  const showChart = byMedian && isNum(medianViews) && medianViews > 0;

  return (
    // Motion follows the viewer's reduced-motion setting.
    <MotionConfig reducedMotion="user">
      <Stack spacing={3}>
        <Box
          sx={{
            ...panelSx,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: showChart ? '340px 1fr' : '1fr' },
          }}
        >
          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography component="div" sx={labelSx}>
              Engagement rate
            </Typography>
            <Typography
              component="div"
              sx={{ fontFamily: serif, fontSize: '48px', lineHeight: '52px', color: CC.blue500 }}
            >
              {`${engagementRate || '—'}%`}
            </Typography>
            {list.length > 0 && (
              <Typography sx={noteSx}>
                {`From ${list.length} ${list.length === 1 ? 'post' : 'posts'}`}
              </Typography>
            )}

            {(byMedian || (denominator === 'followers' && isNum(followerCount))) && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: `1px solid ${CC.light100}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                }}
              >
                {byMedian && isNum(meanEngagement) && (
                  <Fact
                    icon="lucide:heart"
                    label="Average total engagement"
                    value={fixed(meanEngagement, 1)}
                  />
                )}
                {byMedian && isNum(medianViews) && (
                  <Fact
                    icon="lucide:play"
                    label="Median views"
                    value={medianViews.toLocaleString()}
                  />
                )}
                {denominator === 'followers' && isNum(followerCount) && (
                  <Fact
                    icon="lucide:users"
                    label="Followers"
                    value={followerCount.toLocaleString()}
                  />
                )}
              </Box>
            )}
          </Box>

          {showChart && (
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: { md: `1px solid ${CC.light100}` },
                borderTop: { xs: `1px solid ${CC.light100}`, md: 'none' },
              }}
            >
              <ViewsChart posts={list} medianViews={medianViews} />
            </Box>
          )}
        </Box>

        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 1.5 }}
          >
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: CC.onyx }}>
              Posts
              <Box component="span" sx={{ ml: 1, fontWeight: 500, color: CC.grey25 }}>
                {list.length}
              </Box>
            </Typography>
            {sortOptions.length > 1 && (
              <SortControl options={sortOptions} value={activeSort} onChange={setSortBy} />
            )}
          </Stack>

          {list.length === 0 ? (
            <Box sx={{ ...panelSx, p: 2.5 }}>
              <Typography sx={{ fontSize: '13px', color: CC.grey50 }}>
                No per-post detail was stored for this result.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                columnGap: 1.5,
                rowGap: 2.5,
              }}
            >
              {shown.map((post, index) => (
                // Keyed by post, so a new order moves each card to its new cell.
                <m.div key={post.postId ?? index} layout="position" transition={SPRING}>
                  <PostCard post={post} metaMetrics={metaMetrics} showViews={hasViews} />
                </m.div>
              ))}
            </Box>
          )}

          {byMedian && !hasSaves && (
            <Typography sx={{ ...noteSx, mt: 1.5 }}>
              Saves are not reported by this source, so they are not part of this rate.
            </Typography>
          )}
        </Box>
      </Stack>
    </MotionConfig>
  );
}

EngagementBreakdown.propTypes = {
  posts: PropTypes.array,
  formulaVersion: PropTypes.string,
  engagementRate: PropTypes.string,
  followerCount: PropTypes.number,
};
