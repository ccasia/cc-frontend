/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable react/no-danger */
import React, { useEffect } from 'react';

// eslint-disable-next-line react/prop-types
const InstagramEmbed = ({ content }) => {
  useEffect(() => {
    // Load the Instagram embed script after the component mounts
    const script = document.createElement('script');
    script.async = true;
    script.src = '//www.instagram.com/embed.js';
    document.body.appendChild(script);
  }, []);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink="https://www.instagram.com/reel/C8ZpzNYx_WW/?utm_source=ig_web_copy_link"
      data-instgrm-version="14"
      style={{ width: '100%', maxWidth: '540px', margin: 'auto' }}
    >
      <a href="https://www.instagram.com/reel/C8ZpzNYx_WW/?utm_source=ig_web_copy_link" />
    </blockquote>
  );
};

export default InstagramEmbed;
