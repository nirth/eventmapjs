// @flow
import type {Event} from './types'

export const allowEventType = (allowedEventType) => ({type, payload}: Event): boolean => type === allowedEventType

export const createSimpleEvent = (type: EventType, payload: Payload = null): Event => ({type, payload})

export const simpleEventFactory = (type: EventType) => (payload: Payload): Event => createSimpleEvent(type, payload)

export const trace = (target, index) => {
  console.log(`Trace ${index}: ${target}`)
  console.log(target)
  console.log('End trace ${index}')

  return target
}
