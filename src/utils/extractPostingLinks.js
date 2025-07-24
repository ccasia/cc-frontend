const isValidSubmission = (submission) => {
  // Skip submissions that are likely to have issues
  const content = submission.content?.toLowerCase() || '';
  
  // Add any known patterns that indicate problematic posts
  const hasValidContent = content.includes('instagram.com') || content.includes('tiktok.com');
  const isRecent = new Date(submission.createdAt) > new Date('2023-01-01'); // Adjust date as needed
  
  return hasValidContent && isRecent;
};

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
  
  const validPostings = postings.filter(isValidSubmission);
  console.log('Valid postings after filtering:', validPostings.length);

  validPostings.forEach(submission => {
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