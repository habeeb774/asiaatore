import React from 'react';
import { cn } from '../../lib/utils.js';

export function Card({ className, ...props }) {
  return <div className={cn('ui-card', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('ui-card__header', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('ui-card__title', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('ui-card__content', className)} {...props} />;
}

