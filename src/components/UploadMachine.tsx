import { createMachine, assign, send, doneInvoke } from 'xstate'

let timeToComplete = 4000
let int: ReturnType<typeof setTimeout>

function randomInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function resolveAfter2Seconds() {
  const num = randomInterval(6, 1)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (num < 2) reject({ status: 'Server error' })
      resolve({ id: 3, uploadUrl: 'https://overhere/somewhere' })
    }, timeToComplete / 2)
  })
}

function resolveAfter4Seconds(details: uploadDetails, files: File[]) {
  const num = randomInterval(6, 1)
  const { uploadUrl, id } = details

  const request = {
    id,
    uploadUrl,
    files,
  }
  console.log(request, 'payload for potential request')

  return new Promise((resolve, reject) => {
    int = setTimeout(() => {
      if (num < 3) reject({ status: 'Server error' })
      resolve({ status: 'successs' })
    }, timeToComplete)
  })
}

function resolveServerNotify() {
  return new Promise((resolve) => {
    int = setTimeout(() => {
      resolve({ status: 'successs' })
    }, timeToComplete / 2)
  })
}

export type uploadDetails = {
  id?: number
  uploadUrl?: string
}

interface MachineContext {
  duration: number
  elapsed: number
  uploadDetails: uploadDetails
  files: File[]
  interval: number
}

export const UploadMachine = createMachine<MachineContext>(
  {
    id: 'fileUploadMachine',
    initial: 'initial',
    context: {
      duration: 0,
      elapsed: 0,
      interval: 0.1,
      uploadDetails: {},
      files: [],
    },
    states: {
      initial: {
        invoke: {
          src: 'getDetails',
          onDone: {
            target: 'idle',
            actions: ['setDetails'],
          },
          onError: {
            target: 'initialFailure',
          },
        },
      },
      idle: {
        entry: ['clearLoading'],
        on: {
          GET_FILE: [
            {
              target: 'pending',
              actions: ['setFiles'],
            },
          ],
        },
      },
      pending: {
        entry: ['setDuration'],
        invoke: [
          {
            id: 'loader',
            src: ({ interval }) => (send) => {
              const intervalInner = setInterval(() => {
                send('TICK')
              }, 1000 * interval)

              return () => {
                clearInterval(intervalInner)
              }
            },
          },
          {
            id: 'upload',
            src: ({ uploadDetails, files }) => (send, receive) => {
              // normally axios, for example, would have a CancelToken, or abort() and would make it way more streamlined
              receive((evt) => {
                if (int && evt.type === 'CANCEL') {
                  clearTimeout(int)
                  send({ type: 'CANCELLED' })
                }
              })

              const promise = resolveAfter4Seconds(uploadDetails, files)
              promise
                .then((response) => send(doneInvoke('upload', response)))
                .catch(() => send({ type: 'FAILED' }))
            },
            onDone: {
              target: 'success',
              actions: ['notifyServer'],
            },
          },
        ],

        on: {
          TICK: {
            actions: assign({
              elapsed: ({ elapsed, interval }) =>
                +(elapsed + interval).toFixed(2),
            }),
          },
          DURATION: {
            actions: assign({
              duration: (_, event) => event.value,
            }),
          },
          CANCEL: {
            actions: send({ type: 'CANCEL' }, { to: 'upload' }),
          },
          CANCELLED: { target: 'idle' },
          FAILED: { target: 'failure', actions: ['clearLoading'] },
        },
      },
      initialFailure: {
        entry: ['notifyError'],
        type: 'final',
      },
      failure: {
        on: {
          RETRY: {
            target: 'pending',
          },
          BACK: {
            target: 'idle',
          },
        },
      },
      success: {
        after: {
          2000: { target: 'idle' },
        },
      },
    },
  },
  {
    actions: {
      setDuration: assign({
        // was'nt sure what exactly was expected, so I just provided an arbitrery number in sync with the "requests"
        duration: (_, __) => (timeToComplete - 500) / 1000,
      }),
      clearLoading: assign({ elapsed: (_, __) => 0 }),
      notifyServer: async () => {
        const response = await resolveServerNotify()
        console.log(response ? 'Notified server' : 'Did not notify server')
        return assign({ elapsed: (_, __) => 0 })
      },
      setDetails: assign({
        uploadDetails: (_, { data }) => data,
      }),
      notifyError: () => {
        console.log('Error, please reboot...')
      },
      setFiles: assign({
        files: (_, { files }) => files,
      }),
    },
    services: {
      getDetails: async () => {
        const data = await resolveAfter2Seconds()

        return data
      },
    },
  },
)
