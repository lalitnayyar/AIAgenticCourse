# Screenshots Directory

This directory contains screenshots of the Personal AI Learning Portal for documentation purposes.

## Required Screenshots

Please add the following screenshots to this directory:

### Main Application Screenshots
- `banner.png` - Wide banner image of the main dashboard
- `dashboard.png` - Dashboard overview with progress metrics
- `planner.png` - Planner page with timer controls and lesson management
- `schedule.png` - Schedule calendar view with date configuration
- `notes.png` - Notes management with week/day organization
- `progress.png` - Progress tracking with weekly bars and daily indicators
- `audit.png` - Audit trail showing activity history

### Modal Screenshots
- `disclaimer.png` - Disclaimer modal with course information

## Screenshot Guidelines

### Technical Requirements
- **Format**: PNG (preferred) or JPG
- **Resolution**: Minimum 1200px width for desktop screenshots
- **Quality**: High quality, clear text and UI elements
- **Browser**: Use Chrome or Firefox for consistent rendering

### Content Guidelines
- Show realistic usage with some completed lessons
- Include sample notes and progress data
- Capture full page content where possible
- Ensure all UI elements are visible and clear

### Taking Screenshots

1. **Start the application**: `npm start` and navigate to `http://localhost:3000`
2. **Add sample data**: Complete a few lessons, add some notes, start/stop timers
3. **Navigate to each page**: Use the top navigation to visit all sections
4. **Capture screenshots**: Use browser developer tools or screenshot tools
5. **Save to this directory**: Place all images in `docs/screenshots/`

### Sample Data Suggestions

Before taking screenshots, add some sample data:
- Complete 2-3 lessons in Week 1
- Add 1-2 notes for different days
- Start and stop a timer to generate audit trail entries
- Select different weeks to show the week selector functionality

## File Naming Convention

Use lowercase filenames with hyphens for spaces:
- ✅ `dashboard.png`
- ✅ `audit-trail.png`
- ❌ `Dashboard Screenshot.png`
- ❌ `audit_trail.PNG`

## Usage in Documentation

These screenshots are referenced in:
- `README.md` - Main project documentation
- `docs/USER_GUIDE.md` - User guide with feature explanations
- GitHub repository display

## Updating Screenshots

When updating the application UI:
1. Retake affected screenshots
2. Maintain consistent naming
3. Update this README if new screenshots are added
4. Commit changes to Git repository
