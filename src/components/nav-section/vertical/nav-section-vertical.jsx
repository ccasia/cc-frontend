import PropTypes from 'prop-types';
import { memo, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import { Divider, Collapse, ListSubheader } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import NavList from './nav-list';

// ----------------------------------------------------------------------

function NavSectionVertical({ data, slotProps, ...other }) {
  return (
    <Stack component="nav" id="nav-section-vertical" {...other}>
      {data.map((group, index) => (
        <Group
          key={group.subheader || index}
          subheader={group.subheader}
          items={group.items}
          slotProps={slotProps}
          whoCanSee={group?.roles}
        />
      ))}
    </Stack>
  );
}

NavSectionVertical.propTypes = {
  data: PropTypes.array,
  slotProps: PropTypes.object,
};

export default memo(NavSectionVertical);

// ----------------------------------------------------------------------

function Group({ subheader, items, slotProps, whoCanSee }) {
  const [open, setOpen] = useState(true);
  const { user } = useAuthContext();

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Function to check if an item should be visible based on roles
  const isItemVisible = useCallback((item) => {
    const { roles } = item;
    
    if (!roles || roles.length === 0) {
      return true; // No role restrictions
    }

    if (user?.role === 'admin') {
      return roles.includes(user?.admin?.role?.name) || roles.includes(user?.admin?.mode);
    }

    return roles.includes(user?.role);
  }, [user]);

  // Filter items to only include visible ones
  const visibleItems = items?.filter(isItemVisible) || [];

  const renderContent = visibleItems.map((list) => (
    <NavList key={list.title} data={list} depth={1} slotProps={slotProps} />
  ));

  // Don't render the group at all if there are no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Stack sx={{ px: 2 }}>
      {subheader ? (
        <>
          <ListSubheader
            disableGutters
            disableSticky
            onClick={handleToggle}
            sx={{
              fontSize: 11,
              cursor: 'pointer',
              typography: 'overline',
              display: 'inline-flex',
              color: 'text.disabled',
              mb: `${slotProps?.gap || 4}px`,
              p: (theme) => theme.spacing(2, 1, 1, 1.5),
              transition: (theme) =>
                theme.transitions.create(['color'], {
                  duration: theme.transitions.duration.shortest,
                }),
              '&:hover': {
                color: 'text.primary',
              },
              ...slotProps?.subheader,
            }}
          >
            {subheader}
          </ListSubheader>

          <Collapse in={open}>{renderContent}</Collapse>
        </>
      ) : (
        renderContent
      )}
      <Divider
        sx={{
          mb: 2,
          mt: 1,
        }}
      />
    </Stack>
  );
}

Group.propTypes = {
  items: PropTypes.array,
  subheader: PropTypes.string,
  slotProps: PropTypes.object,
  whoCanSee: PropTypes.array,
};
