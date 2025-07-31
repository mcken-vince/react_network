import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [key])

  // Save to localStorage whenever value changes (but not during initial load)
  useEffect(() => {
    if (!isLoading) {
      try {
        if (storedValue === null || storedValue === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(storedValue))
        }
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error)
      }
    }
  }, [key, storedValue, isLoading])

  return [storedValue, setStoredValue, isLoading]
}