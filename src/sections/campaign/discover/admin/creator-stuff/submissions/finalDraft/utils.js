import { enqueueSnackbar } from 'notistack';

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

export const getVideoSize = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    return formatFileSize(blob.size);
  } catch (error) {
    console.error('Error getting video size:', error);
    return 'Unknown';
  }
};

export const handleDownload = async (videoUrl) => {
  try {
    const response = await fetch(videoUrl);
    const contentType = response.headers.get('content-type');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    let filename = videoUrl.split('/').pop() || 'video';

    const extensionMap = {
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'video/webm': '.webm',
    };

    const extension = extensionMap[contentType] || `.${videoUrl.split('.').pop()}` || '.mp4';
    filename = filename.replace(/\.[^/.]+$/, '') + extension;

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    enqueueSnackbar('Failed to download video', { variant: 'error' });
  }
};

export default {
  formatFileSize,
  getVideoSize,
  handleDownload,
}; 