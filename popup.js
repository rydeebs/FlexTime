import React from 'react';
import ReactDOM from 'react-dom';
import LoginPage from './login';
import { dd4c37c3-3a02-44e3-9947-df74b9b56c2b } from './config';

// This function will be used to get the extension's URL
const getExtensionUrl = (path) => chrome.runtime.getURL(path);

const App = () => {
  return (
    <LoginPage getExtensionUrl={getExtensionUrl} />
  );
};

document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      root
    );
  } else {
    console.error('Root element not found');
  }
});

// Function to handle Google sign-in
function handleGoogleSignIn() {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      // Handle error (e.g., show a notification to the user)
      return;
    }
    
    // Use the token to fetch user info or perform other actions
    console.log('Google sign-in successful, token:', token);
    // TODO: Implement further actions with the token
  });
}

// Function to handle Microsoft sign-in
function handleMicrosoftSignIn() {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.ms_client_id;
  const redirectUrl = chrome.identity.getRedirectURL();
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=openid profile email https://graph.microsoft.com/Calendars.Read`;

  chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  }, function(redirectUrl) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      // Handle error (e.g., show a notification to the user)
      return;
    }

    // Extract the access token from the redirect URL
    const url = new URL(redirectUrl);
    const params = new URLSearchParams(url.hash.slice(1));
    const token = params.get('access_token');

    if (token) {
      console.log('Microsoft sign-in successful, token:', token);
      // TODO: Implement further actions with the token
    } else {
      console.error('Failed to get access token');
      // Handle error (e.g., show a notification to the user)
    }
  });
}

// Expose these functions globally so they can be called from the React component
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleMicrosoftSignIn = handleMicrosoftSignIn;