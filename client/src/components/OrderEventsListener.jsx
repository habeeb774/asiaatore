import React from 'react'
import useSse from '../utils/useSse'

export default function OrderEventsListener({ onOrderEvent }) {
  useSse('/api/events', {
    onEvent: (type, payload) => {
      if (!payload) return
      if (type === 'order.created' || type === 'order.updated') {
        onOrderEvent && onOrderEvent(type, payload)
      }
    }
  })
  return null
}
