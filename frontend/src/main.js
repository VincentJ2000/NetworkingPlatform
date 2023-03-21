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
            setToken(data.token, data.userId);
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
          setToken(data.token, data.userId);
        });
});

//Get Job feed
const populateFeed = () => {
    apiCall('job/feed', 'GET', {}, "?start=0")
    .then((data) => {
        console.log(data);
        data.sort((a, b) => b.createdAt - a.createdAt);
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
            cardText4.textContent = "Start Date: " + feedItem.start.substring(0,10);

            const cardText3 = document.createElement("p");
            cardText3.classList.add("card-text");
            getUserData(feedItem.creatorId).then((data) => {
              cardText3.textContent = "Creator: " + data.name;
            })

            const likesContainer = document.createElement("div");
            likesContainer.setAttribute("class", "flex-container");
            const likesInfo = document.createElement("div");
            likesInfo.setAttribute("class", "flex-item");
            likesInfo.textContent = likesList(feedItem.likes);
            likesContainer.appendChild(likesInfo);

            const likeButton = document.createElement("button");
            likeButton.setAttribute("class", "flex-item");
            likeButton.setAttribute("class", "btn btn-primary");
            likeButton.setAttribute("id", "likeButton");
            likeButton.textContent = "Like";
            likeButton.addEventListener("click", () => {
              let likeState = true;

              if (likeButton.textContent === "Unlike") {
                likeState = false;
                likeButton.textContent = "Like";
                likeButton.setAttribute("class", "btn btn-primary");
              } else {
                likeButton.textContent = "Unlike";
                likeButton.setAttribute("class", "btn btn-secondary")
              }

              const payload = {
                id: feedItem.id,
                turnon: likeState
              }
              apiCall('job/like', 'PUT', {}, payload);
            })

            likesContainer.appendChild(likeButton);

            const commentsContainer = document.createElement("div");
            commentsContainer.textContent = "Comments: " + feedItem.comments.length;
            for (comment of feedItem.comments) {
              const commentDOM = createCommentChild(comment);
              commentsContainer.appendChild(commentDOM);
            }

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
            cardBody.appendChild(likesContainer);
            cardBody.appendChild(commentsContainer);
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
        console.log(data);
        resolve(data);
      })
  });
}

// get list of Likes
const likesList = (arr) => {
  let list = "Liked by: ";
  for (user of arr) {
    list = list + user.userName + ", "
  }
  
  return list.slice(0, -1)
}

const createCommentChild = (comment) => {
  const individualComment = document.createElement("div");
  individualComment.setAttribute("class", "card card-body");
  const commentTitle = document.createElement("h5");
  commentTitle.setAttribute("class", "card-title");
  commentTitle.textContent = comment.userName;
  const commentInfo = document.createElement("p");
  commentInfo.setAttribute("class", "card-text");
  commentInfo.textContent = comment.comment;
  individualComment.appendChild(commentTitle);
  individualComment.appendChild(commentInfo);

  return individualComment;
}

const getMyProfile = () => {
  const id = localStorage.getItem('userId');
  console.log(id);
  getUserData(id)
  .then((data) => {
    
      const inputId = document.querySelector('input[aria-label="id"]');
      const inputEmail = document.querySelector('input[aria-label="email"]');
      const inputName = document.querySelector('input[aria-label="name"]');
      const inputWatching = document.querySelector('input[aria-label="watching"]');
      
      inputId.value = '';
      inputEmail.value = '';
      inputName.value = '';
      inputWatching.value = '';

      inputId.value = data.id;
      inputEmail.value = data.email;
      inputName.value = data.name;
      inputWatching.value = `Watched by ${data.watcheeUserIds.length} people: `;
    
      if (data.watcheeUserIds.length === 1){
        getUserData(data.watcheeUserIds[0]).then((data) => {
          inputWatching.value += data.name;
        });
      }else if((data.watcheeUserIds.length > 1)){
        getUserData(data.watcheeUserIds[0]).then((data) => {
          inputWatching.value += data.name;
        });
        for (let i = 1; i < data.watcheeUserIds.length; i++){
          getUserData(data.watcheeUserIds[i]).then((data) => {
            inputWatching.value += ", " + data.name;
          });
        }
      }
      
      const jobs = data.jobs;
      document.getElementById('job-list').textContent = '';
      for (const jobItem of jobs) {
          console.log(jobItem)

          const card = document.createElement("div");
          card.classList.add("card");
          card.classList.add("mb-3");

          const cardImage = document.createElement("img");
          cardImage.classList.add("card-img-top");
          cardImage.setAttribute("src", jobItem.image);
          cardImage.setAttribute("alt", "Job Image");
          cardImage.setAttribute("style", "max-width: 100%; height: 200px;");

          const cardBody = document.createElement("div");
          cardBody.classList.add("card-body");

          const cardTitle = document.createElement("h3");
          cardTitle.classList.add("card-title");
          cardTitle.textContent = jobItem.title;

          const cardText1 = document.createElement("p");
          cardText1.classList.add("card-text");
          cardText1.textContent = jobItem.description;

          const cardText4 = document.createElement("p");
          cardText4.classList.add("card-text");
          cardText4.textContent = "Start Date: " + jobItem.start.substring(0,10);

          const cardText3 = document.createElement("p");
          cardText3.classList.add("card-text");
          getUserData(jobItem.creatorId).then((data) => {
            cardText3.textContent = "Creator: " + data.name;
          })
          
          const cardText2 = document.createElement("p");
          cardText2.classList.add("card-text");

          const cardText2Small = document.createElement("small");
          cardText2Small.classList.add("text-muted");
          cardText2Small.textContent = getDate(jobItem.createdAt);

          cardText2.appendChild(cardText2Small);
          cardBody.appendChild(cardTitle);
          cardBody.appendChild(cardText4);
          cardBody.appendChild(cardText1);
          cardBody.appendChild(cardText3);
          cardBody.appendChild(cardText2);
          card.appendChild(cardImage);
          card.appendChild(cardBody);
          document.getElementById('job-list').appendChild(card);
      }
  });
}

const navigateTab = () => {
  const navigationLink = document.querySelectorAll('.nav-item.nav-link');
  navigationLink.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetTab = document.querySelector(event.target.dataset.target);
      const targetLink = event.target.getAttribute('id');
      
      document.querySelector('.nav-item.nav-link.active').classList.remove('active');
      document.querySelector('.tab-pane.fade.show.active').classList.remove('show', 'active');
      event.target.classList.add('active');
      targetTab.classList.add('show', 'active');

      navigationLink.forEach((link) => {
        if (link.getAttribute('id') === targetLink) {
          link.setAttribute('aria-selected', true);
        } else {
          link.setAttribute('aria-selected', false);
        }
      });

      //call get my profile here
      if(targetLink === "nav-profile-tab"){
        getMyProfile();
      }
    });
  });
}


//helper functions
const show = (element) => {
    document.getElementById(element).classList.remove('hide');
}
const hide = (element) => {
    document.getElementById(element).classList.add('hide');
}
const setToken = (token, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', id);
    show('section-logged-in');
    hide('section-logged-out');
    populateFeed();
    navigateTab();
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
    localStorage.removeItem('userId');
});


//MAIN
if (localStorage.getItem('token')) {
    show('section-logged-in');
    hide('section-logged-out');
    populateFeed();
    navigateTab();
}
  