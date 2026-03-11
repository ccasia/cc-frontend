import PropTypes from 'prop-types';
import { memo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import { Divider, Tooltip } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

import NavList from './nav-list';

// ----------------------------------------------------------------------

function NavSectionMini({ data, slotProps, ...other }) {
  return (
    <Stack
      component="nav"
      id="nav-section-mini"
      spacing={`${slotProps?.gap || 4}px`}
      sx={{
        width: '100%',
        alignItems: 'center',
        ...other.sx,
      }}
      {...other}
    >
      <Divider
        sx={{
          mb: 1,
          mt: 1,
        }}
      />
      {data.map((group, index) => (
        <Group key={group.subheader || index} items={group.items} slotProps={slotProps} />
      ))}
    </Stack>
  );
}

NavSectionMini.propTypes = {
  data: PropTypes.array,
  slotProps: PropTypes.object,
};

export default memo(NavSectionMini);

// ----------------------------------------------------------------------

function Group({ items, slotProps }) {
  const { user } = useAuthContext();

  // Function to check if an item should be visible based on roles
  const isItemVisible = useCallback(
    (item) => {
      const { roles } = item;

      if (!roles || roles.length === 0) {
        return true; // No role restrictions
      }

      if (user?.role === 'admin') {
        return roles.includes(user?.admin?.role?.name) || roles.includes(user?.admin?.mode);
      }

      return roles.includes(user?.role);
    },
    [user]
  );

  // Filter items to only include visible ones
  const visibleItems = items?.filter(isItemVisible) || [];

  // Don't render the group at all if there are no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <>
      {visibleItems.map((list) => (
        <NavList key={list.title} data={list} depth={1} slotProps={slotProps} />
      ))}
      {/* <Divider
        sx={{
          mb: 2,
          mt: 1,
        }}
      /> */}
    </>
  );
}

Group.propTypes = {
  items: PropTypes.array,
  slotProps: PropTypes.object,
};
