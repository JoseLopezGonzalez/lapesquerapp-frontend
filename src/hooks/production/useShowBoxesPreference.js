'use client'

import { useState } from 'react'

const STORAGE_KEY = 'production_show_boxes'

/**
 * Hook compartido para la preferencia "mostrar cajas".
 * Persiste en localStorage. Compartido entre OutputsManager y ConsumptionsManager.
 */
export function useShowBoxesPreference(defaultValue = true) {
  const [showBoxes, setShowBoxes] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved !== null ? saved === 'true' : defaultValue
    }
    return defaultValue
  })

  const handleToggleBoxes = (checked) => {
    setShowBoxes(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, checked.toString())
    }
  }

  return { showBoxes, setShowBoxes, handleToggleBoxes }
}
