import chai, {expect} from 'chai'
import dirtyChai from 'dirty-chai'

import {allowEventType} from './utils'
import {createNextState, processEventMap} from './createNextState'

chai.use(dirtyChai)

const initializeApp = () => true
const updateName = ({payload: name}) => name
const updateAge = ({payload: age}) => age
const updateFirstName = ({payload: firstName}) => firstName
const updateLastName = ({payload: lastName}) => lastName

const flatFixtures = () => ({
  initialState: {
    initialized: false,
    numTimesRefreshed: 0,
  },
  eventMap: [
    ['initialized', allowEventType('initialize'), () => true],
    ['numTimesRefreshed', allowEventType('refresh'), ({payload: prev}) => prev + 1],
  ],
})

const oneLevelDeepFixtures = () => ({
  initialState: {
    initialized: false,
    user: {
      name: null,
      age: null,
    },
  },
  eventMap: [
    ['initialized', allowEventType('initialize'), () => true],
    [
      'user',
      true,
      [['name', allowEventType('updateName'), updateName], ['age', allowEventType('updateAge'), updateAge]],
    ],
  ],
})

const twoLevelDeepFixtures = () => ({
  initialState: {
    initialized: false,
    user: {
      name: {
        firstName: null,
        lastName: null,
      },
      age: null,
    },
  },
  eventMap: [
    ['initialized', allowEventType('initialize'), initializeApp],
    [
      'user',
      true,
      [
        [
          'name',
          true,
          [
            ['firstName', allowEventType('updateFirstName'), updateFirstName],
            ['lastName', allowEventType('updateLastName'), updateLastName],
          ],
        ],
        ['age', allowEventType('updateAge'), updateAge],
      ],
    ],
  ],
})

describe('createNextState should', () => {
  it('exist', () => {
    expect(createNextState).to.exist()
    expect(createNextState).to.be.a('function')
  })

  it('show both substate and full state to transformers', () => {
    const initialState = {a: 1, b: 2, c: 3, sum: 0}
    const computeSum = (_1, state) => {
      expect(state).to.deep.equal({a: 1, b: 2, c: 3, sum: 0})
      const {a, b, c} = state
      return a + b + c
    }

    const eventMap = [['sum', allowEventType('sum'), computeSum]]

    const stateOne = createNextState(eventMap, initialState, [], {type: 'sum', payload: true})
    expect(stateOne).to.deep.equal({a: 1, b: 2, c: 3, sum: 6})
  })

  it('create next state for simple (flat) event map', () => {
    const {initialState, eventMap} = flatFixtures()

    const stateOne = createNextState(eventMap, initialState, [], {type: 'initialize', payload: true})
    expect(stateOne).to.deep.equal({initialized: true, numTimesRefreshed: 0})

    const stateTwo = createNextState(eventMap, stateOne, [], {type: 'refresh', payload: 0})
    expect(stateTwo).to.deep.equal({initialized: true, numTimesRefreshed: 1})

    const stateThree = createNextState(eventMap, stateTwo, [], {type: 'refresh', payload: 1})
    expect(stateThree).to.deep.equal({initialized: true, numTimesRefreshed: 2})
  })

  it('create next state for one level deep event map', () => {
    const {initialState, eventMap} = oneLevelDeepFixtures()

    const stateOne = createNextState(eventMap, initialState, [], {type: 'initialize', payload: true})
    expect(stateOne).to.deep.equal({initialized: true, user: {name: null, age: null}})

    const stateTwo = createNextState(eventMap, stateOne, [], {type: 'updateName', payload: 'Malika'})
    expect(stateTwo).to.deep.equal({initialized: true, user: {name: 'Malika', age: null}})

    const stateThree = createNextState(eventMap, stateTwo, [], {type: 'updateAge', payload: 30})
    expect(stateThree).to.deep.equal({initialized: true, user: {name: 'Malika', age: 30}})
  })

  it('create next state for two level deep event map', () => {
    const {initialState, eventMap} = twoLevelDeepFixtures()

    const stateOne = createNextState(eventMap, initialState, [], {type: 'initialize', payload: true})
    expect(stateOne).to.deep.equal({initialized: true, user: {name: {firstName: null, lastName: null}, age: null}})

    const stateTwo = createNextState(eventMap, stateOne, [], {type: 'updateFirstName', payload: 'Malika'})
    expect(stateTwo).to.deep.equal({initialized: true, user: {name: {firstName: 'Malika', lastName: null}, age: null}})

    const stateThree = createNextState(eventMap, stateTwo, [], {type: 'updateLastName', payload: 'Favre'})
    expect(stateThree).to.deep.equal({
      initialized: true,
      user: {name: {firstName: 'Malika', lastName: 'Favre'}, age: null},
    })

    const stateFour = createNextState(eventMap, stateThree, [], {type: 'updateAge', payload: 30})
    expect(stateFour).to.deep.equal({
      initialized: true,
      user: {name: {firstName: 'Malika', lastName: 'Favre'}, age: 30},
    })
  })
})