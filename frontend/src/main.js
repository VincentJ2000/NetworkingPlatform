import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

const apiCall = (path, method, body, arg) => {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'Content-type': 'application/json',
        },
      };
      if (method === 'GET') {
        // Come back to this
        path = path + arg;
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
            showErrorModal(data.error);
            alert(data.error);
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
      // showErrorModal("Confirm password doest not match.");
      alert("Confirm password doest not match.");
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

//Get Job feed
const populateFeed = () => {
    apiCall('job/feed', 'GET', {}, "?start=0")
    .then((data) => {
        document.getElementById('feed-items').textContent = '';
        for (const feedItem of data) {
            console.log(feedItem)
  
            const card = document.createElement("div");
            card.classList.add("card");
            card.classList.add("mb-3");

            const cardImage = document.createElement("img");
            cardImage.classList.add("card-img-top");
            cardImage.setAttribute("src", feedItem.image);
            cardImage.setAttribute("alt", "Job Image");
            cardImage.setAttribute("style", "max-width: 100%; height: 200px;");

            const cardBody = document.createElement("div");
            cardBody.classList.add("card-body");

            const cardTitle = document.createElement("h3");
            cardTitle.classList.add("card-title");
            cardTitle.textContent = feedItem.title;

            const cardText1 = document.createElement("p");
            cardText1.classList.add("card-text");
            cardText1.textContent = feedItem.description;

            const cardText4 = document.createElement("p");
            cardText4.classList.add("card-text");
            cardText4.textContent = "Start Date: " + feedItem.start;

            const cardText3 = document.createElement("p");
            cardText3.classList.add("card-text");
            getUserData(feedItem.creatorId).then((data) => {
              cardText3.textContent = "Creator: " + data.name;
            })

            const cardText5 = document.createElement("p");
            cardText5.classList.add("card-text");
            cardText5.textContent = "Likes: ";

            const cardText6 = document.createElement("p");
            cardText6.classList.add("card-text");
            cardText6.textContent = "Comments: ";

            const cardText2 = document.createElement("p");
            cardText2.classList.add("card-text");

            const cardText2Small = document.createElement("small");
            cardText2Small.classList.add("text-muted");
            cardText2Small.textContent = getDate(feedItem.createdAt);

            cardText2.appendChild(cardText2Small);
            cardBody.appendChild(cardTitle);
            cardBody.appendChild(cardText4);
            cardBody.appendChild(cardText1);
            cardBody.appendChild(cardText3);
            cardBody.appendChild(cardText5);
            cardBody.appendChild(cardText6);
            cardBody.appendChild(cardText2);
            card.appendChild(cardImage);
            card.appendChild(cardBody);
            document.getElementById('feed-items').appendChild(card);
        }
    });
};

//get user name
const getUserData = (id) => {
  return new Promise((resolve, reject) => {
    apiCall('user', 'GET', {}, `?userId=${id}`)
      .then((data) => {
        resolve(data);
      })
  });
}


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
    populateFeed();
}
const getDate = (dateString) => {
    const givenDate = new Date(dateString);
    const currentDate = new Date();
    const difference = currentDate - givenDate;
    const diffHours = Math.floor(difference / (1000 * 60 * 60));
    const diffMinutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 24){
        const year = givenDate.getFullYear();
        const month = givenDate.getMonth() + 1; // Adding 1 because getMonth() returns a zero-based index
        const day = givenDate.getDate();
        return "Posted on " + day + "/" + month + "/" + year;
    }else{
      if (diffHours <= 0){
        return "Posted " + diffMinutes + " minutes ago";
      }else{
        return "Posted " +diffHours+ " hours and " + diffMinutes + " minutes ago";
      }
    }
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
    populateFeed();
}
  