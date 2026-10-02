import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import SavedPostPreview from './SavedPostPreview';

it('uses an image when saved, then a public post preview if the image expires', () => {
  render(<SavedPostPreview thumbnailUrl="https://images.example.com/post.jpg" postUrl="https://www.instagram.com/reel/test123/" />);
  const image = screen.getByAltText('Saved post thumbnail');
  expect(image).toHaveAttribute('src', 'https://images.example.com/post.jpg');
  fireEvent.error(image);
  expect(screen.getByTitle('Saved post preview')).toHaveAttribute('src', 'https://www.instagram.com/p/test123/embed/');
});
it('uses the existing placeholder when neither an image nor a post link is available', () => {
  render(<SavedPostPreview />);
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.queryByTitle('Saved post preview')).toBeNull();
});
