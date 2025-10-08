import { useState, useCallback } from 'react'
import { postAPI } from '../utils/api'

export default function usePostFeed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const fetchFeed = useCallback(async (reset = false) => {
    setLoading(true)
    setError(null)

    try {
      const currentOffset = reset ? 0 : offset
      const response = await postAPI.getFeed({ limit, offset: currentOffset })
      
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
      console.error('Error fetching feed:', err)
      setError(err.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [offset, limit])

  const refresh = useCallback(() => {
    setOffset(0)
    setHasMore(true)
    return fetchFeed(true)
  }, [fetchFeed])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchFeed(false)
    }
  }, [loading, hasMore, fetchFeed])

  const createPost = useCallback(async (postData) => {
    try {
      const response = await postAPI.createPost(postData)
      const newPost = response.post
      
      // Add new post to the beginning of the feed
      setPosts(prev => [newPost, ...prev])
      
      return newPost
    } catch (err) {
      console.error('Error creating post:', err)
      throw err
    }
  }, [])

  const updatePost = useCallback(async (postId, updateData) => {
    try {
      const response = await postAPI.updatePost(postId, updateData)
      const updatedPost = response.post
      
      // Update post in the feed
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
      
      // Remove post from the feed
      setPosts(prev => prev.filter(post => post.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      throw err
    }
  }, [])

  return {
    posts,
    loading,
    error,
    hasMore,
    fetchFeed: refresh,
    refresh,
    loadMore,
    createPost,
    updatePost,
    deletePost
  }
}
