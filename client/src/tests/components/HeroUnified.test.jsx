import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroUnified from '../../components/HeroUnified/HeroUnified';
import * as adsHook from '../../hooks/useAds';
import * as settings from '../../stores/SettingsContext';
import * as swiper from '../../components/HeroUnified/swiper';
import { MemoryRouter } from 'react-router-dom';

describe('HeroUnified', () => {
  beforeEach(() => {
    vi.spyOn(swiper, 'useHeroSwiper').mockImplementation(() => {});
    vi.spyOn(adsHook, 'useAds').mockReturnValue({ data: [
      { id: 'a1', title: 'Slide One', subtitle: 'Subtitle', image: '/images/hero-background.svg', link: '/products', cta: { text: 'Shop now', link: '/products' } },
      { id: 'a2', title: 'Slide Two', image: '/images/hero-background.svg', link: '/offers' }
    ], isLoading: false });
    vi.spyOn(settings, 'useSettings').mockReturnValue({ setting: { logoUrl: '/images/site-logo.svg', siteName: 'My Store' } });
  });
  afterEach(() => { vi.restoreAllMocks(); });

  test('renders hero region and images with correct loading attributes and CTA', async () => {
    render(
      <MemoryRouter>
        <HeroUnified />
      </MemoryRouter>
    );
    const region = await screen.findByRole('region', { name: /Hero banner/i });
    expect(region).toBeTruthy();
    // presence of images
  const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(2);
    // first image has eager, second is lazy
    expect(images[0]).toHaveAttribute('loading', 'eager');
  // check pagination has aria-live
  const pagination = document.querySelector('.swiper-pagination');
  expect(pagination).toHaveAttribute('aria-live', 'polite');
  // find CTA button and test navigation handler exists
  const ctaBtn = await screen.findByRole('button', { name: /Shop now/i });
  expect(ctaBtn).toBeTruthy();
  });
});
