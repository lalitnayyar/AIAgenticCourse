# Personal AI Learning Portal

A comprehensive React-based learning portal for tracking progress through "The Complete Agentic AI Engineering Course" by Lalit Nayyar.

## Features

### 🎯 Dashboard
- **Progress Overview**: Real-time completion percentage and lesson statistics
- **Week Selection**: Choose any week (1-6) to view specific metrics
- **Time Tracking**: Total time spent, expected duration, and efficiency ratios
- **Streak Counter**: Daily learning streak tracking

### 📅 Planner
- **Interactive Lesson Management**: Check off completed lessons
- **Real-Time Timer**: Start/stop timers for individual lessons with live display
- **Week Navigation**: Browse through all 6 weeks of course content
- **Progress Visualization**: Visual indicators for completed lessons

### 📊 Progress
- **Weekly Progress Bars**: Visual progress tracking for each week
- **Daily Breakdown**: Day-wise progress indicators within each week
- **Color-Coded Weeks**: Different colors for easy week identification
- **Completion Statistics**: Detailed progress metrics

### 📝 Notes
- **Week/Day Organization**: Notes organized by course structure
- **CRUD Operations**: Create, edit, and delete notes
- **Auto-Save**: Automatic persistence to localStorage
- **Notes Overview**: Quick navigation to all saved notes

### 🗓️ Schedule
- **Calendar View**: Week and day-wise course calendar
- **Flexible Start Date**: Configurable course start date
- **Duration Calculations**: Expected time per day, week, and total course
- **Visual Indicators**: Today's date, past/future day highlighting
- **Schedule Summary**: Total weeks, days, lessons, and duration overview

### 📋 Audit Trail
- **Activity Logging**: Complete history of lesson completions and timer events
- **Timestamped Entries**: Detailed timestamps for all activities
- **Event Types**: Lesson completion, timer start/stop events
- **Visual Indicators**: Icons and color coding for different event types

### ℹ️ Course Information
- **Floating Disclaimer**: Always-accessible course information bubble
- **Author Details**: Contact information for Lalit Nayyar
- **Course Link**: Direct link to Udemy course with coupon code
- **Legal Disclaimer**: Proper attribution and educational use notice

## Technical Stack

- **Frontend**: React 18 with React Router DOM
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React Context API
- **Data Persistence**: Browser localStorage
- **Icons**: SVG icons and emoji
- **Responsive Design**: Mobile-friendly interface

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lalitnayyar/AIAgenticCourse.git
   cd AIAgenticCourse/learning-portal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Open browser**: Navigate to `http://localhost:3000`

## Course Structure

The portal follows the complete 6-week course structure:
- **Week 1**: Foundations of Agentic AI (5 days, 15 lessons)
- **Week 2**: Core Technologies & Frameworks (5 days, 15 lessons)
- **Week 3**: Advanced Implementation Techniques (5 days, 15 lessons)
- **Week 4**: Real-World Applications (5 days, 15 lessons)
- **Week 5**: Optimization & Scaling (5 days, 15 lessons)
- **Week 6**: Professional Deployment (5 days, 15 lessons)

## Data Persistence

All user data is stored locally in the browser:
- **Lesson Progress**: Completed lessons tracking
- **Time Tracking**: Individual lesson timers and total time spent
- **Notes**: All notes organized by week/day
- **Audit Trail**: Complete activity history
- **Settings**: Selected week, course start date, and preferences

## Features in Detail

### Time Tracking System
- Individual lesson timers with start/stop controls
- Real-time timer display while recording
- Automatic time accumulation and persistence
- Integration with audit trail for complete activity logging

### Notes Management
- Week and day-based organization matching course structure
- Rich text editing capabilities
- Auto-save functionality with localStorage persistence
- Quick navigation between different notes

### Progress Monitoring
- Real-time progress calculations
- Visual progress bars for weeks and days
- Efficiency metrics comparing expected vs actual time
- Streak tracking for motivation

### Schedule Management
- Flexible course start date configuration
- Automatic calculation of expected durations
- Visual calendar with past/present/future indicators
- Comprehensive schedule summary

## Contributing

This is a personal learning tool. For suggestions or improvements, please contact:
- **Author**: Lalit Nayyar
- **Email**: lalitnayyar@gmail.com

## License

This project is for educational use only. All course content belongs to the original course creator.

## Original Course

**The Complete Agentic AI Engineering Course**
- **Instructor**: Lalit Nayyar
- **Platform**: Udemy
- **Link**: [View Course](https://www.udemy.com/course/the-complete-agentic-ai-engineering-course/?couponCode=MT260825G1)

---

*Built with ❤️ for effective learning and progress tracking*
