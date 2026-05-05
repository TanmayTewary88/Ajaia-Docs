import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#201d1a',
            color: '#faf8f5',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1px solid #3f3630',
          },
          success: { iconTheme: { primary: '#4a5e4a', secondary: '#faf8f5' } },
          error: { iconTheme: { primary: '#b5451b', secondary: '#faf8f5' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
