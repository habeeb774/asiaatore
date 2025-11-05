import React from 'react';

export type CarouselProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

// Minimal carousel placeholder: horizontal scroll with a track wrapper.
export default function Carousel({ children, className = '', style }: CarouselProps) {
  return (
    <div className={`carousel w-full overflow-x-auto overscroll-x-contain ${className}`} style={style} data-carousel-init="1">
      <div className="carousel__track flex items-stretch gap-3">
        {children}
      </div>
    </div>
  );
}
