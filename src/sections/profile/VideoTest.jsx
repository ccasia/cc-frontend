import React, { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import { Box, Typography } from '@mui/material';

import axiosInstance from 'src/utils/axios';

import { UploadBox } from 'src/components/upload';

const VideoTest = () => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [file, setFile] = useState(null);

  const mutation = useMutation({
    mutationFn: async (f) => {
      if (!f) throw new Error('File is required');
      const formData = new FormData();
      formData.append('video', f);

      const res = await axiosInstance.post('/api/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return res.data;
    },
    mutationKey: ['video'],

    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  const handleVideoUpload = (f) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      setVideoUrl(reader.result);
    };

    reader.readAsDataURL(f);
  };

  return (
    <Box>
      <Typography variant="h3">Video Test</Typography>

      <UploadBox
        accept={{
          'video/*': [],
        }}
        onDrop={async (files) => {
          setFile(files[0]);
          handleVideoUpload(files[0]);
        }}
      />

      {videoUrl && (
        <video
          src={videoUrl}
          style={{
            width: 300,
          }}
          autoPlay
          controls
        >
          <track kind="captions" />
          <source src={videoUrl} />
        </video>
      )}

      <LoadingButton
        onClick={() => {
          mutation.mutate(file);
        }}
        variant="outlined"
        loading={mutation.isPending}
      >
        Upload
      </LoadingButton>

      <Toaster />
    </Box>
  );
};

export default VideoTest;
