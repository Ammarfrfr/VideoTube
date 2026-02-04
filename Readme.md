# 🎥 VideoTube

VideoTube is a **MERN stack-based video sharing platform** inspired by YouTube, built to practice full-stack development concepts such as user authentication, video handling, and scalable backend APIs.

---

## Features

- User authentication (Register / Login)
- Upload and view videos
- Like and comment on videos
- User profiles
- Responsive frontend UI
- RESTful API architecture

---

## Tech Stack

**Frontend**
- React
- JavaScript
- HTML5
- CSS3

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

**Other Tools**
- JWT for authentication
- Postman for API testing
- Git & GitHub for version control

---

## Project Structure

``` bash
VideoTube/
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middlewares
│   └── server.js
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── screenshots
│   ├── home.png
│   ├── login.png
│   ├── register.png
│   ├── video-player.png
│   └── profile.png
│
└── README.md
```

---

##  Installation & Setup

### 1️ Clone the repository
```bash
git clone https://github.com/Ammarfrfr/VideoTube.git
cd VideoTube
```

### 2 Backend Setup

``` bash
cd backend
npm install
```

### create your own backend .env in the backend folder

- PORT=*
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_secret_key

### Run backend server

``` bash
npm start
```

### API testing

- API were tested using postman
- Followed RESTful conventions for clean and scalable backend design

### Future Improvements

- Video recommendations
- Search and filter functionality
- Comment replies
- Frontend for UI/UX
- Deployment (Cloud / Docker)
