import { interpret } from 'xstate'
import { UploadMachine } from '../UploadMachine'

jest.setTimeout(15000)

it('should reach "idle" given "failure" when the "BACK" event occurs', () => {
  const expectedValue = 'idle'

  const actualState = UploadMachine.transition('failure', { type: 'BACK' })

  expect(actualState.matches(expectedValue)).toBeTruthy()
})

it('should reach "pending" given "idle" when the "GET_FILE" event occurs', () => {
  const expectedValue = 'pending'

  const actualState = UploadMachine.transition('idle', { type: 'GET_FILE' })

  expect(actualState.matches(expectedValue)).toBeTruthy()
})

it('should eventually reach "idle"', (done) => {
  const fetchService = interpret(UploadMachine).onTransition((state) => {
    if (state.matches('idle')) {
      done()
    }
  })

  fetchService.start()
})

it('should eventually reach "success" or "failure', (done) => {
  const fetchService = interpret(UploadMachine).onTransition((state) => {

    if (state.matches('idle')) {
      fetchService.send({ type: 'GET_FILE' })
    }

    if (state.matches('success') || state.matches('failure')) {
      done()
    }
  })

  fetchService.start()
})
