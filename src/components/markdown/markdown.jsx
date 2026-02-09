/* eslint-disable perfectionist/sort-imports */
import 'src/utils/highlight';

import PropTypes from 'prop-types';
// markdown plugins
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

import Link from '@mui/material/Link';

import { RouterLink } from 'src/routes/components';

import Image from '../image';
import StyledMarkdown from './styles';

// ----------------------------------------------------------------------

// Convert plain URLs in text to HTML anchor tags so rehypeRaw renders them as clickable links.
// Skips URLs already inside markdown links ](url) or HTML href="url" attributes.
const linkifyContent = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text.replace(
    /(?<!\]\()(?<!="|=')(https?:\/\/[^\s<>)"']+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
};

export default function Markdown({ sx, children, ...other }) {
  return (
    <StyledMarkdown sx={sx}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
        {...other}
      >
        {linkifyContent(children)}
      </ReactMarkdown>
    </StyledMarkdown>
  );
}

Markdown.propTypes = {
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

const components = {
  img: ({ ...props }) => <Image alt={props.alt} ratio="16/9" sx={{ borderRadius: 2 }} {...props} />,
  a: ({ ...props }) => {
    const isHttp = props.href.includes('http');

    return isHttp ? (
      <Link target="_blank" rel="noopener" {...props} />
    ) : (
      <Link component={RouterLink} href={props.href} {...props}>
        {props.children}
      </Link>
    );
  },
};
