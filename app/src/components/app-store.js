import { store } from '@risingstack/react-easy-state';
import cookies from './cookies';
import Amplify, { Auth } from 'aws-amplify';

// https://medium.com/dailyjs/design-patterns-with-react-easy-state-830b927acc7c
// https://github.com/RisingStack/react-easy-state

const appStore = store({
  Auth: Auth,
  cognito: {
    config: {
      // These four values are needed before we can call Amplify.configure():
      userPoolId: '',
      clientId: '',
      identityPoolId: '',
      region: ''  
    },
    checkConfigIsComplete: () => {

      if (appStore.cognito.config.userPoolId
        && appStore.cognito.config.clientId
        && appStore.cognito.config.identityPoolId
        && appStore.cognito.config.region
      ) {
        // If the configuration is complete, we need to immediately call  
        // Amplify.configure() before we render any components that rely on 
        // on Amplify's { Auth } components:
        console.log('Cognito config is complete.');
        appStore.cognito.configIsComplete = true;
        appStore.configureAuth();
      }
      else {
        console.log('Cognito config is not complete.')
        appStore.cognito.configIsComplete = false;
        appStore.cognito.configErrorMessage = 'Cognito configuration is incomplete.';
      }
    },
    configIsComplete: false,
    configErrorMessage: null,
    loggedIn: false,
    username: '',
    password: '',
    accessToken: {},              // this will later be populated upon successful login
    loadedCookies: false          // used to make sure we only try to load settings from cookies once
  },
  loadStateFromCookies: () => {
    // We call this function upon app's first load to see if we have previously-saved values: 
    if (!appStore.loadedCookies) {
      const cookieValues = cookies.getAll();
      console.log('Loaded cookies:', cookieValues);
      appStore.cognito.username = cookieValues.username || '';
      appStore.cognito.config.userPoolId = cookieValues.userPoolId || '';
      appStore.cognito.config.clientId = cookieValues.clientId || '';
      appStore.cognito.config.identityPoolId = cookieValues.identityPoolId || '';
      appStore.cognito.config.region = cookieValues.region || ''; 
      appStore.loadedCookies = true;
      appStore.cognito.checkConfigIsComplete();
    }
  },
  saveStateToCookies: () => {
    cookies.set('userPoolId', appStore.cognito.config.userPoolId);
    cookies.set('clientId', appStore.cognito.config.clientId);
    cookies.set('identityPoolId', appStore.cognito.config.identityPoolId);
    cookies.set('region', appStore.cognito.config.region);
    console.log(`Saved config to cookies:`, appStore.cognito.config);
  },
  clearLoginSession: () => {
    // Not sure if we're actually using this function???
    console.log('Auth session cleared.');
    appStore.loggedIn = false;
    appStore.accessToken = {};
  },
  configureAuth: () => {
    try {
      Amplify.configure({
        Auth: {
          identityPoolId: appStore.cognito.config.identityPoolId,
          region: appStore.cognito.config.region,
          userPoolId: appStore.cognito.config.userPoolId,
          userPoolWebClientId: appStore.cognito.config.clientId,
          mandatorySignIn: true,
          authenticationFlowType: 'USER_SRP_AUTH',
        }
      });
      console.log('Successfully configured Amplify Auth.');
      appStore.cognito.configErrorMessage = null;
    }
    catch (err) {
      console.log(`Failed to configure Amplify Auth: ${err}`);
      appStore.cognito.configErrorMessage = err.message;
      appStore.cognito.configIsComplete = false;
    }
   
  }
});

// When first loaded, let's get initial values from cookies (if available)
appStore.loadStateFromCookies();

export default appStore;