import PropTypes from 'prop-types';

import { Box, Link, Stack, Table, TableRow, TableBody, TableCell, TableHead, Typography } from '@mui/material';

import EngagementBreakdown from 'src/sections/campaign/discover/client/v3-pitches/guest-extraction/engagement-breakdown';

import SavedPostPreview from './SavedPostPreview';

const counter = (value) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';
const date = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString() : '—';

function PostTable({ posts, excluded = false }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label={excluded ? 'Excluded saved posts' : 'Saved posts'}>
        <TableHead><TableRow>
          {['Preview', 'Post', 'Caption', 'Date', 'Views', 'Likes', 'Comments', 'Saves', 'Shares', ...(excluded ? ['Reason'] : [])].map((label) => <TableCell key={label}>{label}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>{posts.map((post, index) => (
          <TableRow key={`${post.postId}-${index}`}>
              <TableCell><Box sx={{ width: 60, height: 80 }}><SavedPostPreview thumbnailUrl={post.thumbnailUrl} postUrl={post.postUrl} /></Box></TableCell>
            <TableCell>{/^https?:\/\//i.test(post.postUrl || '') ? <Link href={post.postUrl} target="_blank" rel="noopener noreferrer">{post.postId || 'Open post'}</Link> : post.postId || '—'}</TableCell>
            <TableCell sx={{ minWidth: 160 }}>{post.caption || '—'}</TableCell>
            <TableCell>{date(post.publishedAt)}</TableCell>
            {['views', 'likes', 'comments', 'saves', 'shares'].map((key) => <TableCell key={key}>{counter(post[key])}</TableCell>)}
            {excluded && <TableCell>{post.rejectedReason || 'Not selected for the sample'}</TableCell>}
          </TableRow>
        ))}</TableBody>
      </Table>
    </Box>
  );
}
PostTable.propTypes = { posts: PropTypes.array.isRequired, excluded: PropTypes.bool };

export default function SavedScrapeDetails({ data }) {
  const scrape = data.scrapeDetails;
  if (!scrape) return null;
  const posts = Array.isArray(scrape.selectedPosts) ? scrape.selectedPosts : [];
  const excluded = (Array.isArray(scrape.candidatePosts) ? scrape.candidatePosts : []).filter((post) => !post.usedInSample);
  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2">Saved scrape details</Typography>
      <Typography variant="caption" color="text.secondary">
        Scraped {date(scrape.scrapedAt)}{data.connected ? ' · Separate from connected account metrics.' : ''}
      </Typography>
      <PostTable posts={posts} />
      {posts.length > 0 && <Box component="details">
        <Typography component="summary" sx={{ cursor: 'pointer' }}>Engagement breakdown</Typography>
        <EngagementBreakdown posts={posts} formulaVersion={scrape.formulaVersion} engagementRate={scrape.engagementRate == null ? null : String(scrape.engagementRate)} followerCount={scrape.followers} />
      </Box>}
      {excluded.length > 0 && <Box component="details">
        <Typography component="summary" sx={{ cursor: 'pointer' }}>Excluded posts ({excluded.length})</Typography>
        <PostTable posts={excluded} excluded />
      </Box>}
    </Stack>
  );
}
SavedScrapeDetails.propTypes = { data: PropTypes.object.isRequired };
