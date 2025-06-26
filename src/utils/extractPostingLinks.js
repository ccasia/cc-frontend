export const extractPostingSubmissions = (submissions) => {
  if (!Array.isArray(submissions)) return [];

  console.log('Processing submissions:', submissions.length);
  console.log('Each submission looks like this: ', submissions)

  // Filter for POSTING submissions with APPROVED status and content
  const postings = submissions.filter(submission => {
    const isPosting = submission.submissionType.type === 'POSTING';
    const isApproved = submission.status === 'APPROVED';
    
    console.log(`Submission ${submission.id}:`, {
      type: submission.submissionType.type,
      isPosting,
      status: submission.status,
      isApproved,
      content: submission.content,
    });
    
    return isPosting && isApproved;
  });
  
  console.log('Found posting submissions:', postings.length);
  console.log('Postings: ', postings)
  
  const extractedSubmissions = [];
  
  postings.forEach(submission => {
    // Enhanced regex patterns for better URL matching
    const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/g;
    const tiktokRegex = /https?:\/\/(www\.)?(vm\.|m\.)?tiktok\.com\/[^\s]+/g;
    
    const instagramMatches = [...(submission.content.matchAll(instagramRegex) || [])];
    const tiktokMatches = [...(submission.content.matchAll(tiktokRegex) || [])];
    
    // Process Instagram URLs
    instagramMatches.forEach(match => {
      const cleanUrl = match[0].replace(/[.,;!?]+$/, '');
      console.log('Found Instagram URL:', cleanUrl);
      extractedSubmissions.push({
        id: submission.id,
        type: submission.submissionType.type,
        content: submission.content,
        user: submission.userId,
        submissionId: submission.id,
        platform: 'Instagram',
        postUrl: cleanUrl,
        campaignName: submission.campaignId || 'Unknown Campaign',
        createdAt: submission.createdAt,
      });
    });
    
    // Process TikTok URLs
    tiktokMatches.forEach(match => {
      const cleanUrl = match[0].replace(/[.,;!?]+$/, '');
      console.log('Found TikTok URL:', cleanUrl);
      extractedSubmissions.push({
        id: submission.id,
        type: submission.submissionType.type,
        content: submission.content,
        user: submission.userId,
        submissionId: submission.id,
        platform: 'TikTok',
        postUrl: cleanUrl,
        campaignName: submission.campaignId || 'Unknown Campaign',
        createdAt: submission.createdAt,
      });
    });
  });
  
  console.log('Extracted submissions with URLs:', extractedSubmissions.length);
  return extractedSubmissions;
};