import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

const apiCall = (path, method, body) => {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'Content-type': 'application/json',
        },
      };
      if (method === 'GET') {
        // Come back to this
      } else {
        console.log(body);
        options.body = JSON.stringify(body);
      }
      if (localStorage.getItem('token')) {
        options.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
      }
  
      fetch('http://localhost:5005/' + path, options)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.log(data.error);
            showErrorModal(data.error);
          } else {
            resolve(data);
          }
        });
    });
  
  };

//register function
document.getElementById('register-button').addEventListener('click', () => {
    const password =  document.getElementById('user-password').value;
    const confirmPassword = document.getElementById('user-password-confirmation').value;
    if (password !== confirmPassword) {
      showErrorModal("Confirm password doest not match.");
    } else {
      const payload = {
          email: document.getElementById('user-email').value,
          password: document.getElementById('user-password').value,
          name: document.getElementById('user-name').value,
      }

      apiCall('auth/register', 'POST', payload)
          .then((data) => {
            setToken(data.token);
          });
    }
});

const showErrorModal = (errorMessage) => {
  document.getElementById('modal-backdrop').style.display = 'block';
  document.getElementById('modal-container').style.display = 'block';
  document.getElementById('modal-container').classList.add('show');
  document.getElementById('modal-text').innerText = errorMessage;
}

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('modal-backdrop').style.display = 'none';
    document.getElementById('modal-container').style.display = 'none';
    document.getElementById('modal-container').classList.remove('show');
});
  
//login function
document.getElementById('login-button').addEventListener('click', () => {
    const payload = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    }
    apiCall('auth/login', 'POST', payload)
        .then((data) => {
          setToken(data.token);
        });
});

//helper functions
const show = (element) => {
    document.getElementById(element).classList.remove('hide');
}
const hide = (element) => {
    document.getElementById(element).classList.add('hide');
}
const setToken = (token) => {
    localStorage.setItem('token', token);
    show('section-logged-in');
    hide('section-logged-out');
    //populateFeed();
}

//logged in section
document.getElementById('nav-register').addEventListener('click', () => {
    
    show('register-page');
    hide('login-page');
});
document.getElementById('nav-login').addEventListener('click', () => {
    show('login-page');
    hide('register-page');
});

//logged out section
document.getElementById('logout').addEventListener('click', () => {
    show('section-logged-out');
    hide('section-logged-in');
    localStorage.removeItem('token');
});


//MAIN
if (localStorage.getItem('token')) {
    show('section-logged-in');
    hide('section-logged-out');
    //populateFeed();
}
  