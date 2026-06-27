#Tech Verse – Full E-Commerce Web Application

Tech Verse is a complete multi-role e-commerce web app built using HTML, CSS, JavaScript, and Firebase.
It supports Buyers, Vendors, and Admins, making it a full-featured marketplace system.

#Repository

https://github.com/Ayyan24/Tech_Verse

#Key Features

Authentication System
Firebase Email/Password Authentication
Role-based access (Admin / Vendor / Buyer)

#Buyer Features

Browse products
View product details
Add to cart 
Checkout system
Wishlist 
Order history
Profile management

#Vendor Features

Add new products
Manage inventory
View orders
Sales reports

#Admin Features

Dashboard overview
Manage users
Approve vendors
Approve products
View reports & orders
Manage categories

#Tech Stack

Frontend: HTML, CSS, JavaScript (Vanilla JS)
Backend: Firebase
Database: Firestore / Realtime Database
Authentication: Firebase Auth

#Project Structure

Tech_Verse-main/
│── index.html
│── login.html
│── signup.html
│── README.md
│
├── admin/
│   ├── dashboard.html
│   ├── users.html
│   ├── categories.html
│   ├── orders.html
│   ├── reports.html
│   ├── product-approval.html
│   └── vendor-approval.html
│
├── buyer/
│   ├── products.html
│   ├── product-details.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── profile.html
│   └── wishlist.html
│
├── vendor/
│   ├── dashboard.html
│   ├── add-product.html
│   ├── manage-products.html
│   ├── inventory.html
│   ├── orders.html
│   └── reports.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── admin.js
│   ├── auth.js
│   ├── cart.js
│   ├── checkout.js
│   ├── common.js
│   ├── data.js
│   ├── firebase-loader.js
│   ├── homepage.js
│   ├── orders.js
│   ├── product-details.js
│   ├── products.js
│   ├── profile.js
│   ├── utils.js
│   ├── vendor.js
│   └── wishlist.js
│
└── firebase/
    └── firebase.js
    
#Setup Instructions

1️⃣ Clone Repository
git clone https://github.com/Ayyan24/Tech_Verse.git
2️⃣ Open Project
Open in VS Code or any IDE
3️⃣ Firebase Setup

Go to Firebase Console and:

Create a project
Enable:
Authentication → Email/Password
Firestore Database
4️⃣ Configure Firebase

Edit file:

firebase/firebase.js

Add your config:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

**Run the Project**
Open index.html in browser
OR
Use Live Server (VS Code)

#Roles Overview

Role	Access
**Admin**	Full system control
**Vendor**	Product & order management
**Buyer**	Shopping & profile

#Known Issues

Login issues with existing users (invalid email bug)
Product addition sometimes not syncing with Firebase
Firestore data overwrite issue (single user problem)

 #Future Improvements

Payment Integration (Stripe / JazzCash / EasyPaisa)
Search & Filters
Progressive Web App (PWA)
Notifications system
AI recommendations

#Contributing
Fork the repository
Create a new branch
Commit your changes
Push & create Pull Request

#Support

If you like this project, please star the repository and share it!
