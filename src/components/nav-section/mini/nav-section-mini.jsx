import { memo } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import { Divider } from '@mui/material';

import NavList from './nav-list';

// ----------------------------------------------------------------------

// Helper function to generate unique keys from navigation items
const getNavItemKey = (item, index) => {
  if (item.path) {
    return item.path;
  }
  
  // If title is a React element, try to extract text content
  if (typeof item.title === 'object' && item.title?.props?.children) {
    return `nav-${item.title.props.children.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  
  // If title is a string
  if (typeof item.title === 'string') {
    return `nav-${item.title.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  
  // Fallback to index
  return `nav-item-${index}`;
};

function NavSectionMini({ data, slotProps, ...other }) {
  return (
    <Stack component="nav" id="nav-section-mini" spacing={`${slotProps?.gap || 4}px`} {...other}>
      {/* <Stack component="nav" id="nav-section-vertical" {...other}> */}
      <Divider
        sx={{
          mb: 1,
          mt: 1,
        }}
      />
      {data.map((group, index) => (
        <Group
          key={group.subheader || index}
          items={group.items}
          slotProps={slotProps}
        />
      ))}
      {/* </Stack> */}
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
      {items.map((list, index) => (
        <NavList key={getNavItemKey(list, index)} data={list} depth={1} slotProps={slotProps} />
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
