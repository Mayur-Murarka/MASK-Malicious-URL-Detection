import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ColorModeScript, ChakraProvider, theme } from '@chakra-ui/react';
import App from './App';
import 'react-toastify/dist/ReactToastify.css';
import Particle from './components/Particle.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <div className="mainClass">
    <Particle />
    <ChakraProvider theme={theme}>
      <ColorModeScript />
      <div className="app-content-wrapper">
        <App />
      </div>
    </ChakraProvider>
  </div>,
);
