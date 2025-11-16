import React from 'react';
import { render, screen } from '@testing-library/react';
import SafeImage from '../../components/common/SafeImage';

describe('SafeImage', () => {
  test('renders src, srcSet, and sizes attributes', () => {
    render(<SafeImage src="/images/foo.png" srcSet={["/images/foo-320w.png 320w","/images/foo-720w.png 720w"]} sizes="(max-width: 600px) 320px, 720px" alt="Test" />);
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('src', '/images/foo.png');
    expect(img).toHaveAttribute('srcset');
    expect(img).toHaveAttribute('sizes', '(max-width: 600px) 320px, 720px');
  });
});
