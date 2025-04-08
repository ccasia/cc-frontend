export const initFacebookSDK = () => {
  window.FB.init({
    appId: '1912785502516586',
    cookie: true,
    xfbml: true,
    version: 'v21.0',
  });
};

export const getFacebookLoginStatus = () =>
  new Promise((resolve, reject) => {
    window.FB.getLoginStatus((response) => {
      resolve(response);
    });
  });

export const fbLogin = () =>
  new Promise((resolve, reject) => {
    window.FB.login((response) => {
      resolve(response);
    });
  });
