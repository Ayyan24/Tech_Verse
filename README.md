# Tech Verse – Full E-Commerce Web Application

Tech Verse is a multi-role e-commerce web application built using HTML, CSS, JavaScript, and Firebase.
It supports Admin, Vendor, and Buyer roles.

# Repository

https://github.com/Ayyan24/Tech_Verse

# Features

## Authentication System 

Firebase Email/Password Authentication
Role-based access (Admin / Vendor / Buyer)

## Buyer Features 

Browse products

View product details

Add to cart

Checkout system

Wishlist

Order history

Profile management

## Vendor Features

Add new products

Manage inventory

View orders

Sales reports

## Admin Features

Dashboard overview

Manage users

Approve vendors

Approve products

View reports & orders

Manage categories

# Tech Stack

**Frontend:** HTML, CSS, JavaScript (Vanilla JS)

**Backend:** Firebase

**Database:** Firestore / Realtime Database

**Authentication:** Firebase Auth

# Setup Guide

## 1. Clone Repository
git clone https://github.com/Ayyan24/Tech_Verse.git

## 2. Open Project

Open in VS Code

## 3. Firebase Setup

Enable Authentication and Firestore

## 4. Add Firebase Config

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

# Run Project

Open index.html
OR use Live Server

# Roles

Admin → Full control

Vendor → Manage products

Buyer → Shopping

# Known Issues

Login issues with existing users (invalid email bug)

Product addition sometimes not syncing with Firebase

Firestore data overwrite issue (single user problem)

# Future Improvements

Payment Integration (Stripe / JazzCash / EasyPaisa)

Search & Filters

Progressive Web App (PWA)

Notifications system

AI recommendations

# Support

If you like this project, please star the repository and share it!
