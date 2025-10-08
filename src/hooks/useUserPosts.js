import { useState, useCallback, useEffect } from 'react'
import { postAPI } from '../utils/api'

export default function useUserPosts(userId) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const fetchPosts = useCallback(async (reset = false) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const currentOffset = reset ? 0 : offset
      const response = await postAPI.getUserPosts(userId, { limit, offset: currentOffset })
      
      const newPosts = response.posts || []
      
      if (reset) {
        setPosts(newPosts)
        setOffset(newPosts.length)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setOffset(prev => prev + newPosts.length)
      }
      
      setHasMore(newPosts.length === limit)
    } catch (err) {
      console.error('Error fetching user posts:', err)
      setError(err.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [userId, offset, limit])

  const refresh = useCallback(() => {
    setOffset(0)
    setHasMore(true)
    return fetchPosts(true)
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchPosts(false)
    }
  }, [loading, hasMore, fetchPosts])

  const updatePost = useCallback(async (postId, updateData) => {
    try {
      const response = await postAPI.updatePost(postId, updateData)
      const updatedPost = response.post
      
      // Update post in the list
      setPosts(prev => 
        prev.map(post => post.id === postId ? updatedPost : post)
      )
      
      return updatedPost
    } catch (err) {
      console.error('Error updating post:', err)
      throw err
    }
  }, [])

  const deletePost = useCallback(async (postId) => {
    try {
      await postAPI.deletePost(postId)
      
      // Remove post from the list
      setPosts(prev => prev.filter(post => post.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      throw err
    }
  }, [])

  // Auto-fetch when userId changes
  useEffect(() => {
    if (userId) {
      refresh()
    }
  }, [userId]) // Only depend on userId to avoid infinite loops

  return {
    posts,
    loading,
    error,
    hasMore,
    fetchPosts: refresh,
    refresh,
    loadMore,
    updatePost,
    deletePost
  }
}
