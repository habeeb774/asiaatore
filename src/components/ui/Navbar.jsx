import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import Button from './Button'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b0f19]/70 backdrop-blur border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary" />
          <span className="font-semibold">My Store</span>
        </Link>
        <nav className="hidden md:flex items-center gap-3">
          <NavLink to="/products" className={({isActive}) => isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'}>Products</NavLink>
          <NavLink to="/brands" className={({isActive}) => isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'}>Brands</NavLink>
          <NavLink to="/offers" className={({isActive}) => isActive ? 'text-primary' : 'text-gray-600 hover:text-primary'}>Offers</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Cart</Button>
          <Button variant="primary" size="sm">Login</Button>
        </div>
      </div>
    </header>
  )
}
