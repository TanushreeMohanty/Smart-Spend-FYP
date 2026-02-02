import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from "../../../packages/shared/context/AuthContext";
import { DataProvider } from "../../../packages/shared/context/DataContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
        <DataProvider>
            <App />
        </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)