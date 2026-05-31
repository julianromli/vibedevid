import { createRpcAction } from '@/lib/rpc-client'

export const getAllProjects = createRpcAction('admin-projects.getAllProjects')
export const adminUpdateProject = createRpcAction('admin-projects.adminUpdateProject')
export const adminDeleteProject = createRpcAction('admin-projects.adminDeleteProject')
export const toggleProjectFeatured = createRpcAction('admin-projects.toggleProjectFeatured')
export const getProjectCategories = createRpcAction('admin-projects.getProjectCategories')
