import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchOverlay from '../../../components/search/SearchOverlay';

describe('SearchOverlay defensive behavior', () => {
  test('does not crash for short queries and keeps stable results shape', async () => {
    const errors = [];
    const origError = console.error;
    console.error = (...args) => {
      errors.push(args.join(' '));
      origError.apply(console, args);
    };

    render(
      <MemoryRouter>
        <SearchOverlay />
      </MemoryRouter>
    );

    // Open the overlay by dispatching the platform specific event
    window.dispatchEvent(new Event('search:focus'));

    const input = await screen.findByRole('searchbox');
    expect(input).toBeInTheDocument();

    // Set a short query (< 2 chars)
    fireEvent.change(input, { target: { value: 'a' } });

    // Wait for debounce effect (if any) and ensure no errors were logged
    await waitFor(() => {
      expect(errors.every(e => !/Cannot read properties of undefined|reading 'length'/.test(e))).toBe(true);
    }, { timeout: 500 });

    // Clean up
    console.error = origError;
  });
});
