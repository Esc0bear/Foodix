import React from 'react';
import { StatusBar } from 'expo-status-bar';
import App from './app/App';

export default function MainApp() {
  return (
    <>
      <StatusBar style="auto" />
      <App />
    </>
  );
}
