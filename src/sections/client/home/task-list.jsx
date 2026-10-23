import { useState } from 'react';
import PropTypes from 'prop-types';

import { alpha } from '@mui/material/styles';
import { Box, Card, Stack, Button, ButtonBase, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { FONTS, dueLabel, groupTasks, ACTION_BLUE } from './utils';

const PAGE_SIZE = 5;

const rowPx = { xs: 2.5, sm: 3 };

const dueColor = { late: 'error.dark', soon: 'text.primary', normal: 'text.secondary' };

export default function TaskList({
  tasks,
  campaignsById,
  filterCampaign,
  onClearFilter,
  onOpenTask,
}) {
  const visible = filterCampaign ? tasks.filter((t) => t.campaignId === filterCampaign.id) : tasks;
  const groups = groupTasks(visible);
  const firstId = groups[0]?.tasks[0]?.id;

  // Back to the first page whenever the campaign filter changes.
  const filterId = filterCampaign?.id ?? null;
  const [paging, setPaging] = useState({ filterId, page: 0 });
  const page = paging.filterId === filterId ? paging.page : 0;
  const setPage = (next) => setPaging({ filterId, page: next });

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, visible.length);

  // Groups are consecutive runs of the sorted list, so each keeps the part inside [start, end).
  let offset = 0;
  const pageGroups = groups
    .map((group) => {
      const from = Math.max(0, start - offset);
      const to = Math.max(from, Math.min(group.tasks.length, end - offset));
      offset += group.tasks.length;
      return { ...group, tasks: group.tasks.slice(from, to) };
    })
    .filter((group) => group.tasks.length);

  return (
    <Card
      component="section"
      aria-labelledby="client-home-tasks"
      sx={{ borderRadius: '16px', border: 1, borderColor: 'divider', boxShadow: 'none' }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        sx={{ px: rowPx, py: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Typography
            id="client-home-tasks"
            component="h2"
            sx={{
              fontFamily: FONTS.tight,
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: '-0.01em',
            }}
          >
            Needs your action
          </Typography>
          {tasks.length > 0 && (
            <Box
              sx={{
                minWidth: 24,
                height: 24,
                px: 0.875,
                borderRadius: '12px',
                bgcolor: ACTION_BLUE,
                color: 'common.white',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '24px',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tasks.length}
            </Box>
          )}
        </Stack>

        {filterCampaign && (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ fontSize: 13 }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {filterCampaign.name}
            </Typography>
            <LinkButton onClick={onClearFilter}>Show all</LinkButton>
          </Stack>
        )}
      </Stack>

      {!groups.length && (
        <Box sx={{ px: rowPx, py: 3.5, borderTop: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
            {filterCampaign
              ? `Nothing pending for ${filterCampaign.name}.`
              : 'Nothing pending from you.'}
          </Typography>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            {filterCampaign
              ? 'Show all to see what other campaigns need.'
              : "We'll list new approvals here as creators send them."}
          </Typography>
        </Box>
      )}

      {pageGroups.map((group) => (
        <Box key={group.key} role="group" aria-label={group.label}>
          <Typography
            sx={{
              px: rowPx,
              pt: 1.5,
              pb: 1,
              borderTop: 1,
              borderColor: 'divider',
              fontSize: 12,
              fontWeight: 500,
              color: group.key === 'overdue' ? 'error.dark' : 'grey.500',
            }}
          >
            {group.label}
          </Typography>

          {group.tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              campaignName={campaignsById.get(task.campaignId)?.name}
              primary={task.id === firstId}
              divided={index > 0}
              onOpen={() => onOpenTask(task)}
            />
          ))}
        </Box>
      ))}

      {pages > 1 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: rowPx, py: 1.5, borderTop: 1, borderColor: 'divider' }}
        >
          <Typography
            sx={{ fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
          >
            {start + 1}–{end} of {visible.length}
          </Typography>
          <Stack direction="row" spacing={1}>
            <PagerButton
              label="Previous tasks"
              icon="eva:arrow-ios-back-fill"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            />
            <PagerButton
              label="Next tasks"
              icon="eva:arrow-ios-forward-fill"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            />
          </Stack>
        </Stack>
      )}
    </Card>
  );
}

TaskList.propTypes = {
  tasks: PropTypes.array.isRequired,
  campaignsById: PropTypes.instanceOf(Map).isRequired,
  filterCampaign: PropTypes.object,
  onClearFilter: PropTypes.func.isRequired,
  onOpenTask: PropTypes.func.isRequired,
};

function PagerButton({ label, icon, disabled, onClick }) {
  return (
    <ButtonBase
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        color: disabled ? 'grey.400' : 'text.primary',
      }}
    >
      <Iconify icon={icon} width={16} />
    </ButtonBase>
  );
}

PagerButton.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

const CTA = { SHORTLIST_REVIEW: 'Review shortlist', CONTENT_REVIEW: 'Review content' };

function TaskRow({ task, campaignName, primary, divided, onOpen }) {
  const due = dueLabel(task.days, task.dueAt);
  const late = task.days < 0;

  return (
    <Box
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) 170px 140px' },
        gap: { xs: 1, sm: 2 },
        alignItems: 'center',
        px: rowPx,
        py: 1.75,
        borderTop: divided ? `1px solid ${alpha(theme.palette.grey[500], 0.12)}` : 0,
        bgcolor: late ? alpha(theme.palette.error.main, 0.08) : 'transparent',
      })}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500, fontSize: 15, lineHeight: 1.35 }}>
          {task.title}
        </Typography>
        <Typography sx={{ mt: 0.375, fontSize: 13, color: 'text.secondary' }}>
          {[campaignName, task.detail].filter(Boolean).join(' · ')}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: 13,
          fontWeight: due.tone === 'normal' ? 400 : 500,
          color: dueColor[due.tone],
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {due.text}
      </Typography>

      <Button
        onClick={onOpen}
        variant={primary ? 'contained' : 'outlined'}
        sx={{
          justifySelf: { xs: 'start', sm: 'stretch' },
          px: 1.75,
          py: 1,
          borderRadius: 1,
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: 'none',
          ...(primary
            ? {
                bgcolor: 'text.primary',
                color: 'background.paper',
                '&:hover': { bgcolor: ACTION_BLUE, boxShadow: 'none' },
              }
            : {
                color: 'text.primary',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'text.primary', color: 'background.paper' },
              }),
        }}
      >
        {CTA[task.type] || 'Open'}
      </Button>
    </Box>
  );
}

TaskRow.propTypes = {
  task: PropTypes.object.isRequired,
  campaignName: PropTypes.string,
  primary: PropTypes.bool,
  divided: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
};

export function LinkButton({ children, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        p: 0,
        border: 0,
        bgcolor: 'transparent',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        color: ACTION_BLUE,
        textDecoration: 'underline',
        textUnderlineOffset: 3,
      }}
    >
      {children}
    </Box>
  );
}

LinkButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
};
