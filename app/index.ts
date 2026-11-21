import './src/backgroundLocation';
import React from 'react';
import { registerRootComponent } from 'expo';
import ErrorBoundary from './src/components/ErrorBoundary';
import App from './App';

function Root() {
  return React.createElement(ErrorBoundary, null, React.createElement(App));
}

// Global error handler
const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
if (globalObj.ErrorUtils) {
  const defaultHandler = globalObj.ErrorUtils.getGlobalHandler && globalObj.ErrorUtils.getGlobalHandler();
  globalObj.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error('Global ErrorUtils fångade fel:', error, 'isFatal:', isFatal);
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
registerRootComponent(Root);
