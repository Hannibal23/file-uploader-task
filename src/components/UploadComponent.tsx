import React, { useCallback } from 'react'
import { useMachine } from '@xstate/react'
import Dropzone from 'react-dropzone'
import { UploadMachine } from './UploadMachine'

function UploadComponent() {
  const [state, send] = useMachine(UploadMachine)
  const { duration, elapsed, files } = state.context

  const uploadFile = useCallback(
    (files: File[]) => {
      send({
        type: 'GET_FILE',
        files,
      })
    },
    [send],
  )

  const retryUpload = useCallback(() => {
    send({
      type: 'RETRY',
    })
  }, [send])

  const goBack = useCallback(() => {
    send({
      type: 'BACK',
    })
  }, [send])

  const cancelUpload = useCallback(() => {
    send({
      type: 'CANCEL',
    })
  }, [send])

  switch (state.value) {
    case 'initial':
      return <p>Loading...</p>
    case 'idle':
      return (
        <div className="dropzone">
          <Dropzone
            onDrop={(acceptedFiles: File[]) => uploadFile(acceptedFiles)}
          >
            {({ getRootProps, getInputProps }) => (
              <section>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop some files here, or click to select files</p>
                </div>
              </section>
            )}
          </Dropzone>
        </div>
      )
    case 'pending':
      return (
        <>
          <p>Loading...</p>
          <progress
            style={{ marginBottom: '10px' }}
            value={elapsed}
            max={duration}
          ></progress>
          <button onClick={cancelUpload}>Cancel</button>
        </>
      )
    case 'failure':
      return (
        <>
          <p>
            Something went wrong when uploading to the server. Would you like to
            retry?
          </p>
          <button style={{ marginBottom: '10px' }} onClick={retryUpload}>
            Retry
          </button>
          <button onClick={goBack}>Go Back</button>
        </>
      )
    case 'success':
      return (
        <p>{`${files.length > 1 ? 'Files' : 'File'} uploaded successfully`!}</p>
      )
    case 'initialFailure':
      return <p>Something went wrong. Please refresh the application.</p>
    default:
      return null
  }
}

export default UploadComponent
