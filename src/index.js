import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SafeApp from './SafeApp';
// import SimpleApp from './SimpleApp'; // Debug version
// import App from './App'; // Original with errors
// import TestApp from './TestApp'; // Test component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SafeApp />
  </React.StrictMode>
);