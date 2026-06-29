import PropTypes from 'prop-types';
import { useRef, useState, forwardRef, useCallback, useImperativeHandle } from 'react';

import {
  Box,
  Chip,
  Stack,
  Button,
  Checkbox,
  InputBase,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import ConfirmDialogV2 from 'src/components/custom-dialog/confirm-dialog-v2';

const ONYX = '#231F20';

// "Select List" dropdown: multi-select bookmark lists to filter the grid, see
// per-list counts, create a new list, or delete an existing one.
const BookmarkListDropdown = forwardRef(
  ({ lists, selectedListIds, onSelectedListIdsChange, onCreateList, onDeleteList }, ref) => {
  const popover = usePopover();
  const buttonRef = useRef(null);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (buttonRef.current) popover.setOpen(buttonRef.current);
    },
  }));

  const selectedSet = new Set(selectedListIds || []);
  const selectedCount = selectedSet.size;

  const handleToggle = useCallback(
    (listId) => {
      const next = new Set(selectedListIds || []);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      onSelectedListIdsChange?.(Array.from(next));
    },
    [onSelectedListIdsChange, selectedListIds]
  );

  const handleCreate = useCallback(
    async (event) => {
      event.stopPropagation();
      const name = newListName.trim();
      if (!name || isCreating) return;
      try {
        setIsCreating(true);
        await onCreateList?.(name);
        setNewListName('');
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, newListName, onCreateList]
  );

  const handleDeleteClick = useCallback((event, list) => {
    event.stopPropagation();
    setListToDelete(list);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (listToDelete) onDeleteList?.(listToDelete.id);
    setListToDelete(null);
  }, [listToDelete, onDeleteList]);

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={popover.onOpen}
        aria-pressed={popover.open ? 'true' : 'false'}
        endIcon={<Iconify icon="eva:chevron-down-fill" width={18} />}
        sx={{
          height: 34,
          minWidth: 'auto',
          width: 'fit-content',
          whiteSpace: 'nowrap',
          px: 2,
          py: 1,
          gap: 0.5,
          color: selectedCount ? '#F5F5F5' : ONYX,
          bgcolor: selectedCount ? ONYX : '#F5F5F5',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 14,
          lineHeight: '18px',
          borderRadius: '100px',
          boxShadow: 'none',
          '& .MuiButton-startIcon': { m: 0 },
          '&:hover': {
            bgcolor: selectedCount ? ONYX : '#F5F5F5',
            boxShadow: 'none',
          },
        }}
      >
        <Box component="span">Select List</Box>
        {selectedCount > 0 && (
          <Box
            component="span"
            sx={{
              minWidth: 18,
              height: 16,
              px: 0.5,
              bgcolor: '#FFFFFF',
              borderRadius: 1,
              color: ONYX,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selectedCount}
          </Box>
        )}
      </Button>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="top-right"
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
          Select List
        </Typography>

        <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
          {lists.length === 0 ? (
            <Typography sx={{ px: 1, py: 1, fontSize: 12, color: '#B0B0B0' }}>
              No lists yet. Create one below.
            </Typography>
          ) : (
            lists.map((list) => (
              <Stack
                key={list.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => handleToggle(list.id)}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                    '& .delete-list-btn': { opacity: 1 },
                  },
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
                  <IconButton
                    className="delete-list-btn"
                    aria-label={`Delete ${list.name}`}
                    onClick={(event) => handleDeleteClick(event, list)}
                    sx={{ p: 0.25, opacity: 0, color: '#B0B0B0', '&:hover': { color: '#FF5630' } }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                  </IconButton>
                  <Typography sx={{ fontSize: 12, color: '#B0B0B0', minWidth: 14, textAlign: 'right' }}>
                    {list.count ?? 0}
                  </Typography>
                  <Checkbox
                    size="small"
                    checked={selectedSet.has(list.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggle(list.id);
                    }}
                    sx={{ p: 0.25, '& svg': { fontSize: 22 }, '&.Mui-checked': { color: '#1340FF' } }}
                  />
                </Stack>
              </Stack>
            ))
          )}
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          sx={{
            mt: 0.5,
            px: 1,
            py: 0.5,
            gap: 0.5,
            border: '1px solid #EBEBEB',
            borderRadius: 1,
          }}
        >
          <InputBase
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreate(event);
            }}
            placeholder="New List..."
            sx={{ flex: 1, fontSize: 14, '& input': { fontSize: 14, p: 0 } }}
          />
          <IconButton
            aria-label="Create list"
            onClick={handleCreate}
            disabled={!newListName.trim() || isCreating}
            sx={{ p: 0.25, color: '#231F20', '&.Mui-disabled': { color: '#231F20', opacity: 0.4 } }}
          >
            {isCreating ? (
              <CircularProgress size={16} />
            ) : (
              <Iconify icon="material-symbols:add" width={20} />
            )}
          </IconButton>
        </Stack>
      </CustomPopover>

      <ConfirmDialogV2
        open={!!listToDelete}
        onClose={() => setListToDelete(null)}
        title="Delete this list?"
        emoji={
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#FFEDEA',
              color: '#FF5630',
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={40} />
          </Box>
        }
        content={
          listToDelete ? (
            <Box sx={{ pb: 2, textAlign: 'center', lineHeight: 2 }}>
              <Chip
                label={listToDelete.name}
                size="small"
                sx={{
                  maxWidth: '100%',
                  mr: 0.75,
                  display: 'inline-flex',
                  verticalAlign: 'middle',
                  bgcolor: '#F5F5F5',
                  color: '#231F20',
                  fontWeight: 600,
                  fontSize: 13,
                  border: '1px solid #E7E7E7',
                }}
              />
              and its saved creators will be permanently removed. This can&apos;t be undone.
            </Box>
          ) : (
            ''
          )
        }
        action={<Button onClick={handleConfirmDelete}>Yes</Button>}
      />
    </>
  );
  }
);

BookmarkListDropdown.propTypes = {
  lists: PropTypes.array,
  selectedListIds: PropTypes.arrayOf(PropTypes.string),
  onSelectedListIdsChange: PropTypes.func,
  onCreateList: PropTypes.func,
  onDeleteList: PropTypes.func,
};

BookmarkListDropdown.defaultProps = {
  lists: [],
  selectedListIds: [],
  onSelectedListIdsChange: undefined,
  onCreateList: undefined,
  onDeleteList: undefined,
};

export default BookmarkListDropdown;
