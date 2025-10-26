import React from 'react'

// Lightweight runtime wrapper that dynamically imports framer-motion
// and exposes `motion.<el>` and `AnimatePresence` as lazy proxies.
// This keeps framer-motion out of the main bundle until a component
// that actually renders animations mounts.

let _ready = null
function ensureLoaded() {
  if (!_ready) {
    _ready = import('framer-motion').then(m => m).catch(() => null)
  }
  return _ready
}

function createLazyComponent(getterName) {
  return function LazyComp(props) {
    const [C, setC] = React.useState(() => null)
    React.useEffect(() => {
      let mounted = true
      ensureLoaded().then(mod => {
        if (!mounted) return
        if (!mod) return setC(() => null)
        const Real = mod[getterName]
        setC(() => Real || null)
      })
      return () => { mounted = false }
    }, [])

    if (!C) return props.fallback || null
    const Comp = C
    return <Comp {...props} />
  }
}

// Proxy for motion.* components. Accessing motion.div, motion.span, etc.
// returns a React component that will render the real motion.<el> once loaded.
export const motion = new Proxy({}, {
  get(_target, prop) {
    // prop can be 'div', 'span', 'svg', etc.
    // use a generated displayName for easier debugging
    const name = String(prop)
    const Comp = function MotionProxy(props) {
      const [Real, setReal] = React.useState(null)
      React.useEffect(() => {
        let mounted = true
        ensureLoaded().then(mod => {
          if (!mounted) return
          if (!mod) return setReal(() => null)
          const motionObj = mod.motion || mod
          const RealComp = motionObj && motionObj[name]
          setReal(() => RealComp || null)
        })
        return () => { mounted = false }
      }, [])
      if (!Real) return props.fallback || null
      const R = Real
      return <R {...props} />
    }
    Comp.displayName = `LazyMotion.${name}`
    return Comp
  }
})

export const AnimatePresence = createLazyComponent('AnimatePresence')

export default {
  motion,
  AnimatePresence
}
