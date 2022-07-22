import React from 'react'
import logo from './logo.svg'
import './App.css'
import UploadComponent from './components/UploadComponent'

function App() {
  return (
    <div className="App">
      <div className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <UploadComponent />
      </div>
    </div>
  )
}
export default App
