import { format } from 'date-fns';
import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import { Box, Stack, Avatar, Button, Typography } from '@mui/material';

import {
  FONTS,
  plural,
  daysUntil,
  isComplete,
  ACTION_BLUE,
  REVIEW_TINT,
  campaignStages,
} from './utils';

const stageColor = { done: 'text.primary', current: ACTION_BLUE, todo: 'grey.500' };

export default function CampaignCard({ campaign, openTasks, selected, onSelect, onView }) {
  const complete = isComplete(campaign);
  const image = campaign?.image[0];

  const daysLeft = daysUntil(campaign.endDate);
  const inReview = Math.max(0, campaign.submissions.received - campaign.submissions.approved);

  let pill = 'On track';
  if (openTasks) pill = `${openTasks} to do`;
  else if (complete) pill = 'Complete';

  let note = campaign.objective || '';
  if (inReview > 0) note = `${plural(inReview, 'submission')} in review`;
  else if (complete) note = 'Campaign complete';

  const select = () => onSelect(campaign.id);

  return (
    <Box
      component="article"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${campaign.name}: show its tasks`}
      onClick={select}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
        }
      }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.25,
        p: 2.5,
        borderRadius: '14px',
        border: '1.5px solid',
        borderColor: selected ? ACTION_BLUE : 'divider',
        bgcolor: 'background.paper',
        boxShadow: '0 1px 2px rgba(18, 18, 20, 0.05)',
        cursor: 'pointer',
        '&:hover': { borderColor: selected ? ACTION_BLUE : 'grey.500' },
        '&:focus-visible': { outline: `2px solid ${ACTION_BLUE}`, outlineOffset: 2 },
      }}
    >
      {/* <Box
        component="img"
        alt="campaign_image"
        src={image}
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 1,
          zIndex: 1,
          height: '100%',
          objectFit: 'cover',
          objectPosition: '0 0',
          maskImage: 'linear-gradient(black, transparent)',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 1,
          zIndex: 1,
          height: '100%',
          backdropFilter: 'blur(1.5px)',
        }}
      /> */}

      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar
          variant="rounded"
          src={campaign.image || campaign.logo}
          alt=""
          sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'grey.200' }}
        >
          {' '}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontFamily: FONTS.serif, fontSize: 22, lineHeight: 1.05 }}>
            {campaign.name}
          </Typography>
          <Typography sx={{ mt: 0.375, fontSize: 12, color: 'text.secondary' }}>
            {daysLeft > 0
              ? `${plural(daysLeft, 'day')} left`
              : `Ended ${format(new Date(campaign.endDate), 'd MMM')}`}
            {' · '}
            <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {campaign.credits.used}/{campaign.credits.assigned}
            </Box>{' '}
            credits
          </Typography>
        </Box>

        <Box
          component="span"
          sx={{
            flex: 'none',
            px: 1.125,
            py: 0.625,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            bgcolor: openTasks ? ACTION_BLUE : 'grey.200',
            color: openTasks ? 'common.white' : 'text.secondary',
          }}
        >
          {pill}
        </Box>
      </Stack>

      <Stack spacing={1.5}>
        {campaignStages(campaign).map((stage) => (
          <StageRow key={stage.label} stage={stage} />
        ))}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={(theme) => ({
          pt: 1.75,
          borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        })}
      >
        <Typography
          sx={{
            minWidth: 0,
            fontSize: 12,
            lineHeight: '16px',
            color: inReview > 0 ? ACTION_BLUE : 'text.secondary',
          }}
        >
          {note}
        </Typography>
        <Button
          variant="outlined"
          onClick={(event) => {
            event.stopPropagation();
            onView(campaign.id);
          }}
          sx={{
            flex: 'none',
            px: 1.5,
            py: 0.875,
            borderRadius: 1,
            fontSize: 13,
            fontWeight: 500,
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'text.primary', color: 'background.paper' },
          }}
        >
          View campaign
        </Button>
      </Stack>
    </Box>
  );
}

CampaignCard.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    objective: PropTypes.string,
    endDate: PropTypes.string,
    logo: PropTypes.string,
    stage: PropTypes.number,
    credits: PropTypes.shape({ used: PropTypes.number, assigned: PropTypes.number }),
    shortlist: PropTypes.shape({ confirmed: PropTypes.number, total: PropTypes.number }),
    submissions: PropTypes.shape({ received: PropTypes.number, approved: PropTypes.number }),
    posting: PropTypes.shape({ posted: PropTypes.number, total: PropTypes.number }),
    image: PropTypes.array,
  }).isRequired,
  openTasks: PropTypes.number,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
};

function StageRow({ stage }) {
  const color = stageColor[stage.state];
  const strong = stage.state !== 'todo';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '72px minmax(0, 1fr) 44px 38px',
        gap: 1.25,
        alignItems: 'center',
        height: 16,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <Box sx={{ color, fontWeight: stage.state === 'current' ? 500 : 400 }}>{stage.label}</Box>
      <Box
        sx={(theme) => ({
          position: 'relative',
          height: 6,
          borderRadius: '3px',
          overflow: 'hidden',
          bgcolor: alpha(theme.palette.grey[500], 0.16),
        })}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${stage.pctWithReview}%`,
            bgcolor: REVIEW_TINT,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${stage.pct}%`,
            bgcolor: stage.state === 'done' ? 'text.primary' : ACTION_BLUE,
          }}
        />
      </Box>
      <Box sx={{ textAlign: 'right', color: 'text.secondary' }}>{stage.count}</Box>
      <Box sx={{ textAlign: 'right', fontWeight: 500, color: strong ? color : 'grey.500' }}>
        {stage.pct}%
      </Box>
    </Box>
  );
}

StageRow.propTypes = {
  stage: PropTypes.object.isRequired,
};

// then if the creator is not linked then can input follower manually
