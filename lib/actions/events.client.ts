import { createRpcAction } from '@/lib/rpc-client'

export const getEvents = createRpcAction('events.getEvents')
export const getEventBySlug = createRpcAction('events.getEventBySlug')
export const getRelatedEvents = createRpcAction('events.getRelatedEvents')
export const submitEvent = createRpcAction('events.submitEvent')
export const getPendingEvents = createRpcAction('events.getPendingEvents')
export const approveEvent = createRpcAction('events.approveEvent')
export const rejectEvent = createRpcAction('events.rejectEvent')
