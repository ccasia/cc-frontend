import PropTypes from 'prop-types';
import { useMemo, useCallback } from 'react';

import { Box, Link, Badge, Stack, Checkbox, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

const ONYX = '#231F20';

// Shared bookmark control: a trigger button that opens a popover for adding the
// creator to one or more existing lists. List creation lives in the "Select List"
// dropdown, not here.
const BookmarkButton = ({
  creator,
  rowKey,
  lists,
  creatorListIds,
  onToggleList,
  onOpenListManager,
  variant,
}) => {
  const popover = usePopover();

  const listIdSet = useMemo(
    () => (creatorListIds instanceof Set ? creatorListIds : new Set(creatorListIds || [])),
    [creatorListIds]
  );
  const isBookmarked = listIdSet.size > 0;

  const handleOpen = useCallback(
    (event) => {
      event.stopPropagation();
      popover.onOpen(event);
    },
    [popover]
  );

  const handleToggle = useCallback(
    (event, listId) => {
      event.stopPropagation();
      onToggleList?.(listId, creator, listIdSet.has(listId));
    },
    [creator, listIdSet, onToggleList]
  );

  const handleOpenManager = useCallback(
    (event) => {
      event.stopPropagation();
      popover.onClose();
      onOpenListManager?.();
    },
    [onOpenListManager, popover]
  );

  return (
    <>
      {variant === 'panel' ? (
        <IconButton
          aria-label={isBookmarked ? 'Edit bookmark lists' : 'Bookmark creator'}
          onClick={handleOpen}
          sx={{
            color: isBookmarked ? '#1340FF' : ONYX,
          }}
        >
          <Iconify
            icon={isBookmarked ? 'material-symbols:bookmark' : 'material-symbols:bookmark-outline'}
            width={24}
          />
        </IconButton>
      ) : (
        <Badge
          badgeContent={listIdSet.size}
          invisible={listIdSet.size === 0}
          overlap="rectangular"
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#231F20',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              p: 0,
              borderRadius: '4px',
              transform: 'scale(1) translate(25%, -25%)',
            },
          }}
        >
          <IconButton
            aria-label={isBookmarked ? 'Edit bookmark lists' : 'Bookmark creator'}
            onClick={handleOpen}
            sx={{
              width: 42,
              height: 42,
              p: 0,
              bgcolor: '#FFFFFF',
              border: '1px solid #E8E8E8',
              borderRadius: 1,
              boxShadow: 'inset 0px -3px 0px #E7E7E7',
              color: ONYX,
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                bgcolor: '#F2F2F2',
                borderColor: '#D6D6D6',
              },
              '& .component-iconify': {
                display: 'block',
                flexShrink: 0,
                lineHeight: 0,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Iconify icon="material-symbols:add" width={24} />
          </IconButton>
        </Badge>
      )}

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="top-right"
        onClick={(event) => event.stopPropagation()}
        sx={{
          p: 0.75,
          width: 220,
          bgcolor: '#FFFFFF',
          backgroundImage: 'none',
          border: '1px solid #E7E7E7',
          borderBottom: '3px solid #E7E7E7',
        }}
      >
        <Typography
          sx={{
            px: 1,
            pt: 0.5,
            pb: 0.75,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: '#636366',
            textTransform: 'uppercase',
          }}
        >
          Save to List
        </Typography>

        <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {lists.length === 0 ? (
            <Typography sx={{ px: 1, py: 1, fontSize: 12, color: '#B0B0B0' }}>
              No lists yet. Create one in{' '}
              <Link
                component="button"
                type="button"
                onClick={handleOpenManager}
                sx={{ fontSize: 12, fontWeight: 600, color: '#1340FF', verticalAlign: 'baseline' }}
              >
                Select List
              </Link>
            </Typography>
          ) : (
            lists.map((list) => {
              const checked = listIdSet.has(list.id);
              return (
                <Stack
                  key={list.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  onClick={(event) => handleToggle(event, list.id)}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#F5F5F5' },
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 14,
                      color: '#000000',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {list.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography
                      sx={{ fontSize: 12, color: '#B0B0B0', minWidth: 14, textAlign: 'right' }}
                    >
                      {list.count ?? 0}
                    </Typography>
                    <Checkbox
                      size="small"
                      checked={checked}
                      onClick={(event) => handleToggle(event, list.id)}
                      sx={{ p: 0.25, '& svg': { fontSize: 22 }, '&.Mui-checked': { color: '#1340FF' } }}
                    />
                  </Stack>
                </Stack>
              );
            })
          )}
        </Box>
      </CustomPopover>
    </>
  );
};

BookmarkButton.propTypes = {
  creator: PropTypes.object,
  rowKey: PropTypes.string,
  lists: PropTypes.array,
  creatorListIds: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
  onToggleList: PropTypes.func,
  onOpenListManager: PropTypes.func,
  variant: PropTypes.oneOf(['card', 'panel']),
};

BookmarkButton.defaultProps = {
  creator: null,
  rowKey: undefined,
  lists: [],
  creatorListIds: [],
  onToggleList: undefined,
  onOpenListManager: undefined,
  variant: 'card',
};

export default BookmarkButton;
