import { useEffect, useRef } from 'react'

export default function useSse(url, { onEvent, withAuthToken = true } = {}) {
  const esRef = useRef(null)
  useEffect(() => {
    const token = withAuthToken ? (localStorage.getItem('my_store_token') || '') : ''
    const full = token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : url
    const es = new EventSource(full)
    esRef.current = es
    const listener = (e) => {
      const { type, data } = e
      let parsed = null
      try { parsed = data ? JSON.parse(data) : null } catch {}
      onEvent && onEvent(type, parsed)
    }
    es.addEventListener('order.created', listener)
    es.addEventListener('order.updated', listener)
    es.addEventListener('heartbeat', listener)
    es.addEventListener('hello', listener)
    return () => { try { es.close() } catch {} }
  }, [url, onEvent, withAuthToken])
}
