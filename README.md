# 🚀 AI Interview Simulator

An intelligent interview preparation platform that helps candidates practice technical interviews with AI-powered evaluation and instant feedback.

## 🌟 Overview

AI Interview Simulator is a web application designed to simulate real-world technical interviews. Users can select a domain and difficulty level, answer interview questions, and receive detailed AI-generated feedback, scores, strengths, improvement suggestions, and model answers.

The platform provides a realistic interview experience while helping users improve communication, technical knowledge, and confidence.

---

## ✨ Features

### 🎯 Smart Question Generation

* Multiple technical domains
* Easy, Medium, and Hard difficulty levels
* Randomized question selection

### 🤖 AI-Powered Evaluation

* Answer quality assessment
* Accuracy scoring
* Clarity evaluation
* Depth analysis
* Example-based scoring

### 📊 Detailed Performance Report

* Overall score (1-10)
* Accuracy score
* Depth score
* Clarity score
* Examples score
* Personalized feedback

### 💡 Learning Support

* Model answers
* Improvement suggestions
* Strength identification
* Interview preparation guidance

### 🌐 Modern Web Interface

* Responsive design
* Clean user experience
* Real-time feedback
* Interactive interview flow

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Python
* Flask

### AI Integration

* Groq API
* Llama 3.3 70B Versatile

### Deployment

* Render

---

## 📂 Project Structure

```text
AI-Interview-Simulator/
│
├── app.py
├── requirements.txt
├── questions.json
│
├── templates/
│   └── index.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       └── script.js
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/AI-Interview-Simulator.git
cd AI-Interview-Simulator
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Linux/Mac:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file or configure Render environment variables.

```env
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_secret_key
```

---

## ▶️ Run Locally

```bash
python app.py
```

Application will start at:

```text
http://localhost:5000
```

---

## 🚀 Deployment on Render

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
gunicorn app:app
```

Environment Variables:

```env
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_secret_key
```

---

## 📸 Screenshots

Add screenshots here after deployment.

### Home Page

Insert screenshot

### Interview Session

Insert screenshot

### AI Evaluation Report

Insert screenshot

---

## 🎯 Future Enhancements

* Voice-based interviews
* Resume analysis
* Behavioral interview rounds
* Coding interview simulation
* Performance dashboard
* Interview history tracking
* User authentication
* Leaderboard system

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your branch
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Burukala Mani Reethika**

Python Developer | AI Enthusiast | Software Engineer Aspirant

Passionate about building AI-powered applications that solve real-world problems and enhance learning experiences.

⭐ If you found this project helpful, consider giving it a star.
