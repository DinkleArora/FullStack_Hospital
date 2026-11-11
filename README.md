Hospital Healthcare Portal

A full-stack web application designed to simplify hospital operations and improve patient accessibility through an integrated healthcare management platform.

About the Project

This project provides a centralized platform for patients and hospital administrators to manage healthcare services efficiently. It brings together appointment scheduling, real-time doctor availability, medical reports, laboratory services, bed requests and ambulance management.

Features

Patient Features
- Patient registration and login
- Browse doctors and hospital services
- Book doctor appointments
- View doctor availability and appointment slots
- Access personal medical reports
- Update health details
- Request hospital beds
- Request ambulance services
- Book laboratory tests

Admin Features
- Admin registration and login
- Manage appointment bookings
- Confirm or cancel appointments
- Manage doctor schedules and slots
- Manage laboratory tests
- Manage hospital beds and bed requests
- Manage ambulance availability
- Upload and manage patient medical reports

Tech Stack

**Frontend**
- HTML
- CSS
- JavaScript
- EJS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB
- Mongoose

**Other Tools & Libraries**
- Express Session
- Nodemon

Project Structure

```text
se_final/
│
├── models/          # MongoDB schemas
├── public/          # Static files (CSS, JS, images)
├── views/           # EJS templates
├── app.js           # Main server file
├── package.json
└── package-lock.json
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Navigate to the project directory

```bash
cd fullstack_hospital
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start MongoDB

Ensure that MongoDB is installed and running locally.

The application currently connects to:

```text
mongodb://127.0.0.1:27017/hospitaldb
```

### 5. Start the application

```bash
npm run dev
```

### 6. Open in browser

```text
http://localhost:8080
```

## Future Improvements

- Real-time patient queue tracking
- Automated appointment reminders
- Enhanced authentication and security
- Improved dashboard analytics
- Online payment integration

## License

This project is developed for educational purposes.
