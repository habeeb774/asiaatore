import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

function Hello({ name = 'World' }) {
  return <div>Hello {name}</div>;
}

describe('Hello component', () => {
  it('renders greeting', () => {
    const { getByText } = render(<Hello name="Store" />);
    expect(getByText('Hello Store')).toBeInTheDocument();
  });
});
