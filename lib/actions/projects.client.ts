import { createRpcAction } from '@/lib/rpc-client'

export const validateAndNormalizeSubmitProjectInput = createRpcAction('projects.validateAndNormalizeSubmitProjectInput')
export const cleanupProjectProvisionalUpload = createRpcAction('projects.cleanupProjectProvisionalUpload')
export const cleanupReplacedProjectProvisionalUpload = createRpcAction(
  'projects.cleanupReplacedProjectProvisionalUpload',
)
export const submitProject = createRpcAction('projects.submitProject')
