# 🎓 UniAssist AI — Student Helpdesk Chatbot

<div align="center">

![UniAssist AI Banner](https://img.shields.io/badge/UniAssist%20AI-Student%20Helpdesk-7c4dff?style=for-the-badge&logo=robot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=flat-square&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)

**An intelligent, offline-first student helpdesk assistant built for Superior University — powered by a local JSON knowledge base with real-time intent matching, live analytics, and session export.**

[✨ Live Demo](#demo) • [⚡ Quick Start](#quick-start) • [📖 Features](#features) • [🗂️ Architecture](#architecture) • [📸 Screenshots](#screenshots)

</div>

---

## 📌 Overview

**UniAssist AI** is a fully local, offline-capable student helpdesk chatbot built for **Superior University, Lahore**. It eliminates the need for an external AI API or backend ML model — all intelligence lives in a carefully curated `intents.json` knowledge base with a custom Jaccard-similarity matching engine running entirely in the browser.

Students can ask about **39 topics** spanning admissions, scholarships, hostel life, fee structure, exams, the student portal, campus facilities, clubs, and more — and receive instant, structured answers 24/7.

---

## ✨ Features

### 🤖 Smart Chatbot Engine
- **39 intent categories** covering all major student queries
- **Custom similarity matching** (Jaccard + keyword boosting) — no ML backend needed
- **Offline-first architecture** — works without internet after initial load
- **Sub-100ms response time** for all queries

### 📊 Live Analytics Panel
- Real-time **Knowledge Base Match** display (matched pattern, similarity %, intent tag)
- **Session statistics**: Questions asked, answers returned, successful matches, fallback responses
- **Intent history log** with confidence scores
- Live **session duration timer**

### 🎨 Professional Dark UI
- Pixel-perfect dark theme with purple accent palette
- Sidebar with **topic chips** for quick navigation
- **FAQ quick-access grid** (8 most common questions)
- Fully responsive layout

### 💬 Conversation Features
- **Typing indicator** with animated dots
- **Chat history** within session
- **Export TXT** — download full conversation transcript
- **Clear Chat** and **New Session** support
- Keyboard shortcut: `Enter` to send, `Shift+Enter` for new line

### 📋 Knowledge Base (39 Topics)
| Category | Topics Covered |
|----------|---------------|
| **Admissions** | Process, eligibility, documents, deadlines |
| **Academics** | Courses, departments, exams, grading, attendance |
| **Finance** | Fee structure, scholarships, payment methods |
| **Campus Life** | Hostel, canteen, transport, WiFi, library, labs |
| **Student Services** | Portal, ID cards, password reset, complaints |
| **Career** | Placement stats, internships, career counseling |
| **Events & Clubs** | Tech fest, sports, cultural clubs, convocation |
| **Support** | Emergency contacts, anti-ragging, medical, lost & found |

---

## 🗂️ Architecture

```
UniAssist AI
│
├── app.py                        # Flask web server (entry point)
├── requirements.txt              # Python dependencies
│
├── templates/
│   └── index.html                # Main UI template (Jinja2)
│
├── static/
│   ├── css/
│   │   └── styles.css            # Complete UI styling
│   │
│   ├── js/
│   │   └── script.js             # Chatbot engine + analytics logic
│   │
│   └── data/
│       └── intents.json          # Knowledge base (39 intents, 300+ patterns)
│
└── README.md
```

### How the Matching Engine Works

```
User Query
    │
    ▼
Tokenization (lowercase, strip punctuation)
    │
    ▼
Jaccard Similarity scored against all 300+ patterns
    │
    ▼
Keyword Boost (direct substring match +0.3 score)
    │
    ▼
Best-match intent selected (threshold: 15%)
    │
    ├─ Match ≥ 15% → Return intent response
    └─ Match < 15% → Return helpful fallback
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- pip (Python package manager)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/uniassist-ai.git
cd uniassist-ai

# 2. Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
python app.py
```

### Open in Browser
```
http://127.0.0.1:5000
```

That's it! The chatbot is fully functional with no external API keys required.

---

## 🧪 Sample Queries to Try

| Query | Expected Intent |
|-------|----------------|
| `How can I get admission?` | `admission_process` |
| `What are the hostel fees?` | `hostel_information` |
| `Tell me about scholarships` | `scholarship_detailed` |
| `Where is the library?` | `library_information` |
| `What courses are available?` | `courses_information` |
| `When are semester exams?` | `examination_detailed` |
| `How to reset my password?` | `password_reset` |
| `Emergency contacts?` | `emergency_contacts` |

---

## 📦 Dependencies

```txt
Flask==3.1.0
```

That's the only backend dependency! The entire chatbot logic runs in vanilla JavaScript on the frontend.

---

## 🔧 Customization

### Adding New Intents

Edit `static/data/intents.json` and add a new object:

```json
{
  "tag": "your_topic_name",
  "patterns": [
    "Question variant 1",
    "Question variant 2",
    "Keyword phrase"
  ],
  "responses": [
    "Your detailed response here.\n\nUse \\n for new lines and emoji for visual hierarchy."
  ]
}
```

### Adjusting Match Threshold

In `static/js/script.js`, find and modify:

```javascript
const THRESHOLD = 0.15; // Lower = more permissive, Higher = stricter
```

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Intent categories | 39 |
| Training patterns | 300+ |
| Avg response time | < 50ms |
| Knowledge base size | ~103KB |
| External API calls | 0 |
| Backend ML required | ❌ None |

---

## 🚀 Deployment Options

### Local (Development)
```bash
python app.py  # Runs on port 5000
```

### Production (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Docker
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

---

## 🤝 Contributing

Contributions are welcome! To add more intents or improve the matching engine:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/add-new-topic`)
3. Add intents to `intents.json` or improve `script.js`
4. Commit your changes (`git commit -m 'Add: new hostel query patterns'`)
5. Push and open a Pull Request

---

## 👨‍💻 Developer

**Built during internship at Superior University, Lahore**

- 🌐 University: [Superior University](https://www.superior.edu.pk)
- 📧 Admissions: admissions@superior.edu.pk
- 📞 Contact: +92-42-111-738-738

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ for Superior University Students

⭐ **Star this repo if it helped you!** ⭐

</div>
