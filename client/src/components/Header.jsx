import React from 'react';
import HeaderNav from './layout/HeaderNav';

// Compatibility wrapper: keep a single header implementation (HeaderNav).
export default function Header(props) {
  return <HeaderNav {...props} />;
}