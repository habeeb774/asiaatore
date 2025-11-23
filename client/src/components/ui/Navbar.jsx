import HeaderNav from '../layout/HeaderNav'

// Simple alias kept for backward compatibility until all imports switch to HeaderNav.
export default function Navbar(props) {
  return <HeaderNav {...props} />
}
