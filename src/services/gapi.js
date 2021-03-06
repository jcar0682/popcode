import loadjs from 'loadjs';
import once from 'lodash-es/once';

import config from '../config';
import ExtendableError from '../util/ExtendableError';

export const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.coursework.me',
];

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest'];

class LoadError extends ExtendableError {}

const loadGapi = once(async() => new Promise((resolve, reject) => {
  loadjs('https://apis.google.com/js/client.js', {
    success() {
      resolve(window.gapi);
    },
    error(failedPaths) {
      reject(new LoadError(`Failed to load ${failedPaths.join(', ')}`));
    },
    numRetries: 16,
  });
}));

export const loadAndConfigureGapi = once(async() => {
  const gapi = await loadGapi();
  await new Promise((resolve, reject) => {
    gapi.load('client:auth2', {
      callback: () => {
        resolve(gapi);
      },
      onerror: reject,
      timeout: 5000,
      ontimeout: () => {
        reject(new Error('Timed out'));
      },
    });
  });
  await gapi.client.init({
    apiKey: config.firebaseApiKey,
    clientId: config.firebaseClientId,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES.join(' '),
  });

  return gapi;
});

export function getGapiSync() {
  if ('gapi' in window) {
    return window.gapi;
  }
  throw new Error(
    'Attempted to synchronously access `gapi` before it was loaded',
  );
}
