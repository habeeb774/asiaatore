import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../../../pages/admin/Settings';
import * as SettingsContext from '../../../contexts/SettingsContext';

describe('Settings SEO Preview', () => {
  beforeEach(() => {
    // Ensure matchMedia exists in this environment (jsdom may not implement it)
    if (typeof window.matchMedia !== 'function') {
      window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      });
    }
    // Mock useSettings to provide a predictable setting
    vi.spyOn(SettingsContext, 'useSettings').mockReturnValue({
      setting: { siteNameEn: 'Original Store', siteNameAr: 'متجر أصلي' },
      loading: false,
      error: null,
      update: vi.fn(),
      uploadLogo: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Cleanup meta title
    document.title = '';
    const meta = document.head.querySelector('meta[property="og:site_name"]');
    if (meta) meta.remove();
  });

  test('apply SEO preview updates document title and og:site_name', async (ctx) => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    // Find the EN site name input and change it
    const inputEn = await screen.findByLabelText(/Store Name \(EN\)/i);
    fireEvent.change(inputEn, { target: { value: 'Preview Shop' } });

    // Click the apply SEO preview button
    const applyBtn = screen.getByRole('button', { name: /تطبيق معاينة SEO/i });
    fireEvent.click(applyBtn);

    // Title should update
    expect(document.title).toBe('Preview Shop');

    // Check OG meta
    const og = document.head.querySelector('meta[property="og:site_name"]');
    expect(og).toBeTruthy();
    expect(og.getAttribute('content')).toBe('Preview Shop');
  }, 10000);
});
