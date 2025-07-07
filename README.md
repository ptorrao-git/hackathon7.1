# Hackathon Project for 7.1 Tech Hub

> Leveraging social interactions and AI to increase engagement, gather valuable user insights, and optimize ad delivery on the **Joyn** platform.

## 📌 Overview

Joyn Social is a proof-of-concept platform built during a one-week hackathon hosted by **7.1 Tech Hub**, a **ProSiebenSat.1 Media SE company**. Our goal was to develop innovative ways to:
- Increase user **engagement**,
- Collect more user data (especially for **cookie-less users**),
- Improve **content recommendation** using AI,
- Enhance **ad targeting capabilities**.

We designed a social layer on top of the Joyn streaming experience—bringing people closer together through shared content while improving business value through smarter recommendations.

---
<br>

## 🧠 Key Features

### Friend System

- Add friends via Joyn Social
- Get better content recommendations based on your friends' watch history
- Create, share, and explore **public watchlists**
- **Suggest shows** to friends based on mutual activity

<br>

### Swipe-to-Like Feature

- Tinder-style swipe interface for shows/movies
- **Swipe right** to like (adds to watchlist), **swipe left** to dislike
- Builds personal taste profile
- Feeds directly into AI recommendation models

<br>

### Recommendation Models

We used a hybrid AI recommendation approach:
- **Collaborative Filtering**: Finds similar users and recommends what they liked
- **Content-Based Filtering**: Uses metadata from media (e.g., genre, actors, tags)

---
<br>

## 💡 Problem Solving

| Problem | Our Solution |
|--------|---------------|
| 🍪 40% cookie-less users | Use friend activity and watchlists to infer preferences |
| 🎯 Ad Targeting | Leverage friend network proximity to optimize ad delivery |
| 📈 Increase engagement | Introduce social interactions and gamify content discovery |
| 🚀 Reach new users | Shared watchlists and recommendations generate viral potential |

---
<br>

## 🛠️ Tech Stack

- **Frontend**: React.js (prototype UI for testing features)
- **Backend**: Node.js (API server)
- **Database**: SQL database hosted on **AWS RDS**
- **AI Models**: Python (Scikit-Learn / Sentence-transformers)
- **Cloud Infra**: AWS (RDS, EC2 for model training/deployment)

---
<br>

## 🗃️ Database Infrastructure

![Screenshot from 2025-04-02 21-56-43](https://github.com/user-attachments/assets/dd0830be-3a2e-42f2-9903-600b5ea49740)

---
<br>

## 📱 App Screenshots

![s1](https://github.com/user-attachments/assets/f12ff890-4a89-47e5-adf2-d2362d0a2965)

---
<br>

## 🧪 AI Model Evaluation

We measured our AI performance using:
- ✅ **CTR** (Click Through Rate)
- ✅ **Useful Recommendations per Recommendation**
- ✅ **NDCG** (Normalized Discounted Cumulative Gain)

This evaluation allowed us to fine-tune our model and deliver highly personalized content suggestions with measurable impact.

---
<br>

## 🚀 Future Improvements

- Integration with real Joyn accounts
- Fine-tune ad recommendations based on collective engagement
- Scaling the model

---
<br>

## 🤝 Team

- [Afogonca](https://github.com/AfonsoMota-132)

- [Diogo Silva](https://github.com/diocode)

- [Filipe Figueira](https://github.com/fi-77-70)

- [Joana Moreira](https://github.com/Joana-pcm)

- [Patrícia || Tenshi](https://github.com/PatzCM)

- [Paulo Faria](https://github.com/paulorsfaria)

- [Paulo Soares](https://github.com/ptorrao-git)


This project was created as part of the 7.1 Tech Hub Hackathon.  
Made with ❤️ by a passionate team of developers!

---
<br>

## 📬 Contact

Have questions or want to collaborate? Reach out via [linkedin](https://www.linkedin.com/in/paulosoaresdev/)
 or [email](dev.paulo.soares@gmail.com)
