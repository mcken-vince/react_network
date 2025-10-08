/**
 * Date formatting utilities
 */

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 60) {
    return 'Just now'
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }
  
  const days = Math.floor(hours / 24)
  if (days === 1) {
    return 'Yesterday'
  }
  if (days < 7) {
    return `${days} days ago`
  }
  
  const weeks = Math.floor(days / 7)
  if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }
  
  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`
  }
  
  const years = Math.floor(days / 365)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

export const formatPostDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  // Less than a day - show relative time
  if (diffInDays < 1) {
    return formatRelativeTime(dateString)
  }
  
  // Less than a week - show day name
  if (diffInDays < 7) {
    return formatRelativeTime(dateString)
  }
  
  // Less than a year - show month and day
  if (diffInDays < 365) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // More than a year - show month, day, and year
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatFullDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
