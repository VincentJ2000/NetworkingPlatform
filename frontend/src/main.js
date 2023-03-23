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
            // alert(data.error);
          } else {
            resolve(data);
          }
        });
    });
  
  };

//register function
document.getElementById('register-button').addEventListener('click', () => {
    const email = document.getElementById('user-email').value;
    const name = document.getElementById('user-name').value;
    const password =  document.getElementById('user-password').value;
    const confirmPassword = document.getElementById('user-password-confirmation').value;

    if (email === "" || name === "" || password === ""  || confirmPassword === "" ) {
      showErrorModal("Please fill in all the details.");
    } else {
      if (password !== confirmPassword) {
        showErrorModal("Confirm password doest not match.");
        // alert("Confirm password doest not match.");
      } else {
        const payload = {
            email: email,
            password: password,
            name: name,
        }
  
        apiCall('auth/register', 'POST', payload)
            .then((data) => {
              setToken(data.token, data.userId);
            });
      }
    }
});

const showErrorModal = (errorMessage) => {
  document.getElementById('modal-backdrop').style.display = 'block';
  document.getElementById('alert-modal').style.display = 'block';
  document.getElementById('alert-modal').classList.add('show');
  document.getElementById('alert-text').textContent = errorMessage;
}

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('modal-backdrop').style.display = 'none';
    document.getElementById('alert-modal').style.display = 'none';
    document.getElementById('alert-modal').classList.remove('show');
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
        data.sort((a, b) => b.createdAt - a.createdAt);
        document.getElementById('feed-items').textContent = '';
        for (const feedItem of data) {
  
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
              cardText3.textContent = "Creator: "
              const creatorName = createLinkName(data.name,"others-profile","my-screen");
              cardText3.appendChild(creatorName);
              let jobNames = JSON.parse(localStorage.getItem('job-names'));
              jobNames.push({ name: data.name, id: feedItem.creatorId });
              localStorage.setItem('job-names', JSON.stringify(jobNames));
            })

            const bottomContainer = document.createElement("div");
            bottomContainer.setAttribute("class", "flex-container");

            // Likes and Comments Section
            const likesCommentsSection = document.createElement("div");
            likesCommentsSection.setAttribute("class", "flex-container");
            bottomContainer.appendChild(likesCommentsSection);

            const likesContainer = document.createElement("a");
            likesContainer.setAttribute("href", "");
            likesContainer.setAttribute("class", "flex-item");
            likesContainer.setAttribute("data-bs-toggle", "modal");
            likesContainer.setAttribute("data-bs-target", "#likesModal");
            likesContainer.textContent = "Likes: " + feedItem.likes.length;
            likesCommentsSection.appendChild(likesContainer);
            likesCommentsSection.appendChild(createModalDOM("likesModal", "Liked by", feedItem.likes));

            const commentsContainer = document.createElement("a");
            commentsContainer.setAttribute("href", "");
            commentsContainer.setAttribute("class", "flex-item");
            commentsContainer.setAttribute("data-bs-toggle", "modal");
            commentsContainer.setAttribute("data-bs-target", "#commentsModal");
            commentsContainer.textContent = "Comments: " + feedItem.comments.length;
            likesCommentsSection.appendChild(commentsContainer);
            likesCommentsSection.appendChild(createModalDOM("commentsModal", "Comments", feedItem.comments));

            // Like and Comment buttons
            const btnContainer = document.createElement("div");
            btnContainer.setAttribute("class", "flex-container");
            bottomContainer.appendChild(btnContainer);

            // Like button
            const likeBtn = document.createElement("button");
            likeBtn.setAttribute("class", "flex-item");
            likeBtn.setAttribute("class", "btn btn-primary");
            likeBtn.setAttribute("id", "likeBtn");
            likeBtn.textContent = "Like";
            feedItem.likes.forEach((item) => {
              if (item.userId === parseInt(localStorage.getItem('userId'))) {
                likeBtn.textContent = "Unlike";
                likeBtn.setAttribute("class", "btn btn-secondary")
              }
            })

            likeBtn.addEventListener("click", () => {
              let likeState = true;

              if (likeBtn.textContent === "Unlike") {
                likeState = false;
                likeBtn.textContent = "Like";
                likeBtn.setAttribute("class", "btn btn-primary");
              } else {
                likeState = true;
                likeBtn.textContent = "Unlike";
                likeBtn.setAttribute("class", "btn btn-secondary")
              }

              const payload = {
                id: parseInt(feedItem.id),
                turnon: likeState
              }
              apiCall('job/like', 'PUT', payload);
            })
            btnContainer.appendChild(likeBtn);

            // Comment button
            const commentBtn = document.createElement("button");
            commentBtn.setAttribute("class", "flex-item");
            commentBtn.setAttribute("class", "btn btn-primary");
            commentBtn.setAttribute("id", "commentBtn");
            commentBtn.textContent = "Comment";
            commentBtn.setAttribute("data-bs-toggle", "modal");
            commentBtn.setAttribute("data-bs-target", "#commentForm");
            btnContainer.appendChild(commentBtn);
            btnContainer.appendChild(createModalDOM("commentForm", `New comment for ${feedItem.title} job post.`, parseInt(feedItem.id)))

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
            cardBody.appendChild(bottomContainer);
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

// Create Modal DOM
const createModalDOM = (id, title, body) => {
  const modalContainer = document.createElement("div");
  modalContainer.setAttribute("class", "modal fade");
  modalContainer.setAttribute("id", id);
  modalContainer.setAttribute("tabindex", "-1");
  modalContainer.setAttribute("role", "dialog");
  modalContainer.setAttribute("aria-labelledby", `${id}Title`);
  modalContainer.setAttribute("aria-hidden", "true");

  const modalDialog = document.createElement("div");
  modalDialog.setAttribute("class", "modal-dialog");
  modalDialog.setAttribute("role", "document");
  modalContainer.appendChild(modalDialog);

  const modalContent = document.createElement("div");
  modalContent.setAttribute("class", "modal-content");
  modalDialog.appendChild(modalContent);

  const modalHeader = document.createElement("div");
  modalHeader.setAttribute("class", "modal-header");
  modalContent.appendChild(modalHeader);

  const modalTitle = document.createElement("h4");
  modalTitle.setAttribute("class", "modal-title");
  modalTitle.setAttribute("id", `${id}Title`);
  modalTitle.textContent = title;
  modalHeader.appendChild(modalTitle);

  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("type", "button");
  closeBtn.setAttribute("class", "btn-close");
  closeBtn.setAttribute("data-bs-dismiss", "modal");
  closeBtn.setAttribute("aria-label", "Close");
  modalHeader.appendChild(closeBtn);

  const modalBody = document.createElement("div");
  modalBody.setAttribute("class", "modal-body");
  modalContent.appendChild(modalBody);

  if (id === "likesModal") {
    for (const item of body) {
      const likesName = createLinkName(item.userName,"others-profile","my-screen");
      const likeChild = document.createElement("div");
      likeChild.appendChild(likesName);
      // likeChild.textContent = likesName;
      modalBody.appendChild(likeChild);
      let likesNames = JSON.parse(localStorage.getItem('likes-names'));
      likesNames.push({ name: item.userName, id: item.userId});
      localStorage.setItem('likes-names', JSON.stringify(likesNames));
    }

  } else if (id === "commentsModal") {
    for (const item of body) {
      const commentChild = createCommentChild(item);
      modalBody.appendChild(commentChild);
    }
  } else if (id === "commentForm") {
    const commentForm = document.createElement("form");
    const formContent = document.createElement("div");
    formContent.setAttribute("class", "mb-3");
    
    const formLabel = document.createElement("label");
    formLabel.setAttribute("for", "comment-text");
    formLabel.setAttribute("class", "col-form-label");
    formLabel.textContent = "Comment:";
    formContent.appendChild(formLabel);
    const textArea = document.createElement("textarea");
    textArea.setAttribute("id", "comment-text");
    textArea.setAttribute("class", "form-control");
    formContent.appendChild(textArea);

    commentForm.appendChild(formContent);
    modalBody.appendChild(commentForm);

    const modalFooter = document.createElement("div");
    modalFooter.setAttribute("class", "modal-footer");
    const sendBtn = document.createElement("button");
    sendBtn.setAttribute("type", "button");
    sendBtn.setAttribute("class", "btn btn-primary");
    sendBtn.setAttribute("data-bs-dismiss", "modal");
    sendBtn.textContent = "Post comment";
    sendBtn.addEventListener("click", () => {
      const payload = {
        id: body,
        comment: textArea.value
      }

      apiCall('job/comment', 'POST', payload);
    })

    modalFooter.appendChild(sendBtn);
    modalContent.appendChild(modalFooter);
  }
  
  return modalContainer;
}

const createCommentChild = (comment) => {
  let commentsNames = JSON.parse(localStorage.getItem('comments-names'));
  commentsNames.push({ name: comment.userName, id: comment.userId});
  localStorage.setItem('comments-names', JSON.stringify(commentsNames));

  const individualComment = document.createElement("div");
  // const commentTitle = document.createElement("h5");

  const commentName = createLinkName(comment.userName,"others-profile","my-screen");
  // commentTitle.textContent = comment.userName;

  const commentInfo = document.createElement("p");
  commentInfo.textContent = comment.comment;
  individualComment.appendChild(commentName);
  individualComment.appendChild(commentInfo);

  return individualComment;
}

// Update my profile
const updateProfile = () => {
  let payload = {
    "email": undefined,
    "password": undefined,
    "name": undefined,
    "image": undefined
  };

  const editButton = document.getElementById("edit-profile");
  editButton.addEventListener('click', () => {
    let prevValues = {};
    const inputs = document.querySelectorAll('input[aria-label="email"], input[aria-label="password"], input[aria-label="name"]');
    const isEditing = editButton.innerText === 'Edit Profile';
    inputs.forEach(input => {
      console.log(input);
      input.toggleAttribute('readonly', !isEditing);
      if (isEditing) {
        prevValues[input.getAttribute('aria-label')] = input.value;
        input.addEventListener('blur', () => {
          if (!input.hasAttribute('readonly')) {
            const label = input.getAttribute('aria-label');
            const newValue = input.value;
            const oldValue = prevValues[label];
            if (newValue !== oldValue) {
              payload[label] = newValue;
            }else{
              payload[label] = undefined;
            }
          }
        });
      } else {
        input.removeEventListener('blur', () => {});
      }
    });
    
    if (isEditing) {
      editButton.innerText = 'Done';
    } else {
      console.log(payload);
      apiCall('user', 'PUT', payload)
        .then((data) => {
          if (data.error) {
            alert(data.error);
          }
        });
      payload = {
        "email": undefined,
        "password": undefined,
        "name": undefined,
        "image": undefined
      };
      editButton.innerText = 'Edit Profile';
    }
  });
}

//get profile for a user
const getProfile = (id, myProfile, inputIdArg, inputEmailArg, inputNameArg, inputWatchingArg, inputWatchingProfileArg, profilePictureArg, jobListArg) => {
  getUserData(id)
  .then((data) => {
      const inputId = document.querySelector(inputIdArg);
      const inputEmail = document.querySelector(inputEmailArg);
      const inputName = document.querySelector(inputNameArg);
      const inputWatching = document.getElementById(inputWatchingArg);
      const inputWatchingProfile = document.getElementById(inputWatchingProfileArg);
      const profilePicture = document.getElementById(profilePictureArg);

      inputId.value = '';
      inputEmail.value = '';
      inputName.value = '';
      // inputWatching.value = '';
      inputWatchingProfile.textContent = '';
      
      if(data.image){
        profilePicture.src = data.image;
      }else{
        profilePicture.src = '../asset/default.jpeg';
      }

      if(myProfile == true){
        const fileInput = document.getElementById("profile-picture-file");
        fileInput.addEventListener("change", () => {
          let payload = {
            "email": undefined,
            "password": undefined,
            "name": undefined
          };
          const file = fileInput.files[0];
          fileToDataUrl(file).then((data) => {
            payload["image"] = data;
            console.log(payload);
            apiCall('user', 'PUT', payload)
            .then((data) => {
              if(data.error){ 
                alert(data.error);
              }
            })
            profilePicture.src = data;
          })
        })
      }
      
      inputWatchingProfile.textContent = data.watcheeUserIds.length;
      inputId.value = data.id;
      inputEmail.value = data.email;
      inputName.value = data.name;
      // inputWatching.value = "";
    
      while (inputWatching.firstChild) {
        inputWatching.removeChild(inputWatching.firstChild);
      }
      
      if (data.watcheeUserIds.length === 1){
        getUserData(data.watcheeUserIds[0]).then((data) => {
          const name = createLinkName(data.name,"others-profile","my-screen");
          const nameContainer = document.createElement("div");
          nameContainer.appendChild(name);
          inputWatching.appendChild(nameContainer);
          // inputWatching.value += data.name;
        });
      }else if((data.watcheeUserIds.length > 1)){
        for (let i = 0; i < data.watcheeUserIds.length; i++){
          getUserData(data.watcheeUserIds[i]).then((data) => {
            const name = createLinkName(data.name,"others-profile","my-screen");
            const nameContainer = document.createElement("div");
            nameContainer.appendChild(name);
            inputWatching.appendChild(nameContainer);
            // inputWatching.value += ", " + data.name;
          });
        }
      }
      
      const jobs = data.jobs;
      document.getElementById(jobListArg).textContent = '';
      for (const jobItem of jobs) {

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

          const cardText2 = document.createElement("p");
          cardText2.classList.add("card-text");

          const cardText2Small = document.createElement("small");
          cardText2Small.classList.add("text-muted");
          cardText2Small.textContent = getDate(jobItem.createdAt);

          cardText2.appendChild(cardText2Small);
          cardBody.appendChild(cardTitle);
          cardBody.appendChild(cardText4);
          cardBody.appendChild(cardText1);
          cardBody.appendChild(cardText2);
          card.appendChild(cardImage);
          card.appendChild(cardBody);
          document.getElementById(jobListArg).appendChild(card);
      }
  });
}

const navigateTab = () => {
  const navigationLink = document.querySelectorAll('.nav-item.nav-link');
  navigationLink.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetTab = document.querySelector(event.target.getAttribute('href'));
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
      if(targetLink === "profile"){
        const id = localStorage.getItem('userId');
        getProfile(id,true, 'input[aria-label="id"]','input[aria-label="email"]','input[aria-label="name"]',"my-watch-by",'profile-watched-by',"my-profile-picture", "job-list");
      }else if(targetLink === "create-job"){
        addJob();
      }
    });
  });
}

//MILESTONE 5
//adding a job
const addJob = () => {
  const submitButton = document.getElementById("create-job-button");
  submitButton.addEventListener('click', () => {
    const inputTitle = document.getElementById("inputTitle");
    const inputStart = document.getElementById("inputStart");
    const inputDescription = document.getElementById("inputDescription");
    const inputImage = document.getElementById("validatedCustomFile");

    const startDate = new Date(inputStart.value);
    const startDateForm = startDate.toISOString();
    console.log(startDateForm);
    
    if(inputImage.files[0]){
      fileToDataUrl(inputImage.files[0]).then((data) => {
        const payload = {
          title: inputTitle.value,
          image: data,
          start: startDateForm,
          description:inputDescription.value
        }
        console.log(payload);
        apiCall('job', 'POST', payload)
            .then((data) => {
              if(data.error){
                alert(data.error);
              }
            });
      })
    }
  })
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
    localStorage.setItem('job-names', JSON.stringify([]));
    localStorage.setItem('likes-names', JSON.stringify([]));
    localStorage.setItem('comments-names', JSON.stringify([]));
    show('section-logged-in');
    hide('section-logged-out');
    populateFeed();
    navigateTab();
    updateProfile();
    backButton();
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
const backButton = () => {
  const backButton = document.getElementById("back-button");
  backButton.addEventListener('click', () => {
    show("my-screen");
    hide("others-profile");
  })
}
const createLinkName = (name,showScreen,hideScreen) => {
  const creatorLink = document.createElement("a");
  creatorLink.href = "#";
  creatorLink.textContent = name;
  const jobNames = JSON.parse(localStorage.getItem('job-names'));
  const likesNames = JSON.parse(localStorage.getItem('likes-names'));
  const commentsNames = JSON.parse(localStorage.getItem('comments-names'));
  const user = JSON.parse(localStorage.getItem('userId'));
  //get the id of the other user stored in a list in local storage
  creatorLink.onclick = (event) => {
    const otherUser = event.target.textContent;
    console.log(event.target.textContent)
    let chosenUser;

    for (let i = 0; i < jobNames.length; i++) {
      if (jobNames[i].name === otherUser) {
        chosenUser = jobNames[i].id;
        break;
      }
    }
    if(!chosenUser){
      for (let i = 0; i < likesNames.length; i++) {
        if (likesNames[i].name === otherUser) {
          chosenUser = likesNames[i].id;
          break;
        }
      }
    }
    if(!chosenUser){
      for (let i = 0; i < commentsNames.length; i++) {
        if (commentsNames[i].name === otherUser) {
          chosenUser = commentsNames[i].id;
          break;
        }
      }
    }

    if(chosenUser === user){
      show(hideScreen);
      hide(showScreen);
      const profileLink = document.querySelector('#profile');
      profileLink.click();
    }else{
      getProfile(chosenUser,false,'input[aria-label="other-id"]','input[aria-label="other-email"]','input[aria-label="other-name"]','other-watch-by','other-profile-watched-by',"other-profile-picture", "other-job-list");
      show(showScreen);
      hide(hideScreen);
    }
    
  };
  creatorLink.setAttribute("data-bs-dismiss","modal");
  return creatorLink;
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
    location.reload();
    show('section-logged-out');
    hide('section-logged-in');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('job-names');
    localStorage.removeItem('likes-names');
    localStorage.removeItem('comments-names');
});

//MAIN
if (localStorage.getItem('token')) {
    show('section-logged-in');
    hide('section-logged-out');
    populateFeed();
    navigateTab();
    updateProfile();
    backButton();
}

