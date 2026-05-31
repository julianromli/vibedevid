import { createRpcAction } from '@/lib/rpc-client'

export const getAllPosts = createRpcAction('admin-posts.getAllPosts')
export const adminUpdatePost = createRpcAction('admin-posts.adminUpdatePost')
export const adminDeletePost = createRpcAction('admin-posts.adminDeletePost')
export const togglePostFeatured = createRpcAction('admin-posts.togglePostFeatured')
export const getAllTags = createRpcAction('admin-posts.getAllTags')
export const createTag = createRpcAction('admin-posts.createTag')
export const deleteTag = createRpcAction('admin-posts.deleteTag')
