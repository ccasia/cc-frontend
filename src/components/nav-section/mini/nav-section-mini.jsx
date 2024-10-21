import { memo } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import { Divider } from '@mui/material';

import NavList from './nav-list';

// ----------------------------------------------------------------------

function NavSectionMini({ data, slotProps, ...other }) {
  return (
    <Stack component="nav" id="nav-section-mini" spacing={`${slotProps?.gap || 4}px`} {...other}>
      {/* {data?.map((group, index) => (
        
        <Group key={group.subheader || index} items={group.items} slotProps={slotProps} />
      ))} */}
      <Stack component="nav" id="nav-section-vertical" {...other}>
        {data.map((group, index) => (
          <Group key={group.subheader || index} items={group.items} slotProps={slotProps} />
        ))}
      </Stack>
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
  return (
    <>
      {items?.map((list) => (
        <NavList key={list.title} data={list} depth={1} slotProps={slotProps} />
      ))}
      <Divider
        sx={{
          mb: 2,
          mt: 1,
        }}
      />
    </>
  );
}

Group.propTypes = {
  items: PropTypes.array,
  slotProps: PropTypes.object,
};
