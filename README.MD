markdown# 📚 Curriculum Tracker - Avanti Fellows

A comprehensive web application for tracking curriculum progress across multiple schools in the Avanti Fellows JNV Program.

## 🌟 Overview

The Curriculum Tracker helps Program Managers and Teachers monitor and manage curriculum completion across JNV (Jawahar Navodaya Vidyalaya) and EMRS centers. It provides real-time insights into chapter completion, test status, and overall progress tracking.

## ✨ Features

### For Teachers
- 📊 **Dashboard Overview**: View your school's ranking and subject performance
- 📖 **Chapter Management**: Track chapter progress with topic-wise completion
- ✅ **Progress Tracking**: Mark chapters complete, log test status, and add notes
- 📈 **Analytics**: Visual charts showing completion rates by class
- 🎂 **Celebrations**: View upcoming birthdays and work anniversaries
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

### For Administrators
- 👥 **Teacher Management**: Add, edit, and manage teacher profiles
- 📚 **Curriculum Management**: Create and organize chapters with topics and target dates
- 📤 **CSV Import**: Bulk import curriculum data
- 📊 **Advanced Analytics**: 8+ interactive charts with filters
- 📋 **Chapter Details**: Comprehensive view of all chapters across schools
- 📥 **Export to Excel**: Download analytics and chapter details
- 🎉 **Celebration Tracking**: Monitor team birthdays and anniversaries

## 🛠️ Tech Stack

- **Frontend**: React 18 (via CDN)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Charts**: Chart.js with Data Labels plugin
- **Data Processing**: PapaParse (CSV), SheetJS (Excel)
- **Build**: Babel (in-browser compilation)

## 📋 Prerequisites

- Firebase account with Firestore and Authentication enabled
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of Firebase console for initial setup

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/curriculum-tracker.git
cd curriculum-tracker
2. Firebase Configuration

Create a new Firebase project at Firebase Console
Enable Firestore Database and Authentication (Email/Password)
Copy your Firebase config and update in index.html:

javascriptconst firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
3. Firestore Security Rules
Set up basic security rules in Firebase Console:
javascriptrules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
4. Create Admin Account

In Firebase Console → Authentication → Add User
Email: admin@avantifellows.org
Password: (your secure password)

5. Deploy

Simply open index.html in a web browser, or
Deploy to hosting service (Firebase Hosting, Vercel, Netlify, etc.)

For Firebase Hosting:
bashnpm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
📊 Data Structure
Firestore Collections
teachers
javascript{
  afid: "AF001",
  name: "Teacher Name",
  email: "teacher@email.com",
  subject: "Physics",
  school: "CoE Barwani",
  dob: "1990-01-01",
  joiningDate: "2020-01-01",
  phone: "1234567890"
}
curriculum
Document ID: {school}_{subject}_{grade}
javascript{
  chapters: [
    {
      id: "P11-1-2024",
      name: "Chapter Name",
      topics: ["Topic 1", "Topic 2"],
      targetDate: "2024-12-31"
    }
  ]
}
chapterProgress
Document ID: {school}_{chapterId}
javascript{
  completed: "Yes/No",
  completionDate: "2024-12-15",
  testConducted: "Yes/No",
  completedTopics: ["Topic 1"],
  notes: "Additional notes"
}
🎨 Customization
Update Schools
Edit the SCHOOLS array in index.html:
javascriptconst SCHOOLS = ['CoE Barwani', 'CoE Cuttak', 'Your School'];
Update Subjects
Edit the SUBJECTS array:
javascriptconst SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology'];
Brand Colors
Update the CSS variables in the <style> section:
css:root {
  --avanti-yellow: #F4B41A;
  --avanti-orange: #E8B039;
  --avanti-red: #C8342E;
}
📱 Screenshots
Add your screenshots here
🔐 Default Login Credentials
Admin:

Email: admin@avantifellows.org
Password: (set during Firebase setup)

Teachers:

Create via Admin panel
Login with assigned email/password

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
👨‍💻 Author
Anand Joshi

Role: Program Manager, Avanti Fellows (JNV Program)
Email: [your-email@avantifellows.org]
GitHub: [@yourusername]

🙏 Acknowledgments

Avanti Fellows team
All teachers using this system
Firebase for backend infrastructure

📞 Support
For issues or questions:

Create an issue on GitHub
Contact: [your-email@avantifellows.org]

🗺️ Roadmap

 Mobile app (React Native)
 WhatsApp notifications
 Advanced reporting
 Parent portal
 Integration with LMS


Made with ❤️ by Anand for Avanti Fellows
