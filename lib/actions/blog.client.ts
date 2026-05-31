import { createRpcAction } from '@/lib/rpc-client'

export const createBlogPost = createRpcAction('blog.createBlogPost')
export const updateBlogPost = createRpcAction('blog.updateBlogPost')
export const getTags = createRpcAction('blog.getTags')
export const getAuthorPosts = createRpcAction('blog.getAuthorPosts')
export const getPostForEdit = createRpcAction('blog.getPostForEdit')
export const deleteBlogPost = createRpcAction('blog.deleteBlogPost')
