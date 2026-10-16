import { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

import { Box, Stack, Avatar, ButtonBase, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { formatRate, compactNumber } from './stages';
import { monoFont, OverviewCard, tabularNums } from './parts';

const PAGE_SIZE = 3;

export default function TopVideos({ videos }) {
  const sorted = [...videos].sort((a, b) => b.views - a.views);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);

  const pager = sorted.length > 0 && (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', ...monoFont }}>
        {start + 1}–{start + visible.length} of {sorted.length}
      </Typography>
      <PagerButton
        label="Previous videos"
        icon="eva:arrow-ios-back-fill"
        disabled={current === 0}
        onClick={() => setPage(current - 1)}
      />
      <PagerButton
        label="Next videos"
        icon="eva:arrow-ios-forward-fill"
        disabled={current >= pages - 1}
        onClick={() => setPage(current + 1)}
      />
    </Stack>
  );

  return (
    <OverviewCard title="Top performing videos" aside={pager}>
      {!sorted.length ? (
        <Box
          sx={{
            py: 6,
            px: 3,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1.5,
            textAlign: 'center',
            fontSize: 13,
            color: 'text.secondary',
          }}
        >
          Featured videos will appear here once the campaign team stars them in Analytics.
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {visible.map((video, i) => (
              <VideoCard key={video.id} video={video} rank={start + i + 1} />
            ))}
          </Box>
          {pages > 1 && (
            <Stack direction="row" justifyContent="center" spacing={0.75} sx={{ mt: 2 }}>
              {Array.from({ length: pages }, (_, i) => (
                <ButtonBase
                  key={i}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === current}
                  onClick={() => setPage(i)}
                  sx={{
                    width: i === current ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: i === current ? 'text.primary' : 'grey.300',
                    transition: (theme) => theme.transitions.create('width'),
                  }}
                />
              ))}
            </Stack>
          )}
        </>
      )}
    </OverviewCard>
  );
}

TopVideos.propTypes = {
  videos: PropTypes.array.isRequired,
};

function PagerButton({ label, icon, disabled, onClick }) {
  return (
    <ButtonBase
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        color: disabled ? 'grey.400' : 'text.primary',
      }}
    >
      <Iconify icon={icon} width={14} />
    </ButtonBase>
  );
}

PagerButton.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

function VideoCard({ video, rank }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        component="a"
        href={video.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: 'relative',
          display: 'block',
          aspectRatio: '9 / 14',
          maxWidth: 1,
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: 'grey.200',
          backgroundImage: video.thumbnailUrl ? `url(${video.thumbnailUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'common.white',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 22,
            height: 22,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: 'grey.900',
            fontSize: 11,
            ...monoFont,
          }}
        >
          {rank}
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            px: 1,
            py: 0.25,
            borderRadius: 999,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: 'text.primary',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {video.platform}
        </Box>
        <Box
          sx={{
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            px: 1.25,
            pt: 4,
            pb: 1.25,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <Typography component="span" sx={{ fontSize: 20, fontWeight: 600, ...tabularNums }}>
            {compactNumber(video.views)}
          </Typography>{' '}
          <Typography component="span" sx={{ fontSize: 11, opacity: 0.85 }}>
            views
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
        <Avatar
          src={video.creator?.photoURL}
          alt={video.creator?.name}
          sx={{ width: 24, height: 24 }}
        />
        <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500 }}>
          {video.creator?.name}
        </Typography>
        {video.postedAt && (
          <Typography sx={{ fontSize: 11, color: 'text.secondary', flex: 'none' }}>
            {format(new Date(video.postedAt), 'MMM d')}
          </Typography>
        )}
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: 11.5, color: 'text.secondary', ...tabularNums }}>
        <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {compactNumber(video.likes)}
        </Box>{' '}
        likes ·{' '}
        <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {formatRate(video.engagementRate)}
        </Box>{' '}
        eng. rate
      </Typography>
    </Box>
  );
}

VideoCard.propTypes = {
  video: PropTypes.object.isRequired,
  rank: PropTypes.number.isRequired,
};
