import React from 'react'

// Filter out framer-motion specific props when falling back to DOM element
function filterMotionProps(props) {
  const motionProps = new Set([
    'whileTap', 'whileHover', 'whileFocus', 'whileDrag', 'whileInView',
    'initial', 'animate', 'exit', 'transition', 'variants', 'layout',
    'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
    'onAnimationStart', 'onAnimationComplete', 'onUpdate'
  ])
  const filtered = {}
  for (const key in props) {
    if (!motionProps.has(key)) {
      filtered[key] = props[key]
    }
  }
  return filtered
}

// Simple fallback motion component
export const motion = new Proxy({}, {
  get(_target, prop) {
    const name = String(prop)
    return function SimpleMotion(props) {
      return React.createElement(name, filterMotionProps(props))
    }
  }
})

export const AnimatePresence = ({ children }) => children

export default {
  motion,
  AnimatePresence
}
