# Personal AI Learning Portal - Administration Guide

## 🛠️ System Administration

### Initial Setup and Installation

#### Prerequisites
- **Node.js**: Version 14.0 or higher
- **npm**: Version 6.0 or higher (comes with Node.js)
- **Git**: For version control and repository management
- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **System Requirements**: 4GB RAM, 500MB storage

#### Installation Process
```bash
# 1. Clone the repository
git clone https://github.com/lalitnayyar/AIAgenticCourse.git

# 2. Navigate to project directory
cd AIAgenticCourse/learning-portal

# 3. Install dependencies
npm install

# 4. Verify installation
npm start
```

#### Verification Steps
1. Application should start without errors
2. Browser should open to `http://localhost:3000`
3. All navigation links should work
4. No console errors in browser developer tools

### Configuration Management

#### Course Structure Configuration
**File**: `src/learning_plan.json`

```json
{
  "weeks": [
    {
      "week": 1,
      "title": "Foundations of Agentic AI",
      "days": [
        {
          "day": 1,
          "lessons": [
            {
              "title": "Introduction to Agentic AI",
              "duration": "15:30",
              "description": "Overview of agentic AI concepts"
            }
          ]
        }
      ]
    }
  ]
}
```

**Modification Guidelines**:
- **Week Numbers**: Must be sequential (1, 2, 3, etc.)
- **Day Numbers**: Must be sequential within each week
- **Duration Format**: Support both "HH:MM:SS" and "MM:SS" formats
- **Titles**: Keep concise for UI display
- **Descriptions**: Optional but recommended for clarity

#### Application Configuration
**File**: `src/App.js`

**Navigation Structure**:
```javascript
<nav className="bg-gray-900 shadow-lg p-4 flex gap-6 justify-center border-b border-gray-700">
  <Link to="/" className="text-white hover:text-blue-400 font-bold transition">
    Dashboard
  </Link>
  // Add new navigation items here
</nav>
```

**Adding New Pages**:
1. Create component in `src/components/`
2. Import in `App.js`
3. Add route in `<Routes>` section
4. Add navigation link

#### Styling Configuration
**File**: `src/App.css`

**Theme Colors**:
```css
:root {
  --primary-blue: #3b82f6;
  --primary-purple: #8b5cf6;
  --success-green: #10b981;
  --warning-orange: #f59e0b;
  --danger-red: #ef4444;
}
```

**Customization Options**:
- Color schemes
- Typography (fonts, sizes)
- Layout spacing
- Animation timings
- Component styling

### Data Management

#### Local Storage Structure
```javascript
// Core data structures
{
  "completedLessons": ["1-1-0", "1-1-1", "1-2-0"], // Array of lesson IDs
  "timeTracking": {
    "1-1-0": {
      "totalTime": 1800000, // milliseconds
      "sessions": [
        {
          "startTime": 1640995200000,
          "endTime": 1640997000000,
          "duration": 1800000
        }
      ]
    }
  },
  "auditTrail": [
    {
      "id": 1640995200000,
      "timestamp": "2025-01-01T10:00:00.000Z",
      "action": "completed",
      "lessonId": "1-1-0",
      "week": 1,
      "day": 1,
      "lessonIndex": 0,
      "lessonTitle": "Introduction to Agentic AI"
    }
  ],
  "notes": {
    "1": {
      "1": [
        {
          "id": 1640995200000,
          "content": "Important concepts about AI agents",
          "timestamp": "2025-01-01T10:00:00.000Z"
        }
      ]
    }
  },
  "selectedWeek": 1,
  "courseStartDate": "2025-08-26"
}
```

#### Data Backup Procedures
```javascript
// Export all user data
function exportUserData() {
  const data = {
    completedLessons: JSON.parse(localStorage.getItem('completedLessons') || '[]'),
    timeTracking: JSON.parse(localStorage.getItem('timeTracking') || '{}'),
    auditTrail: JSON.parse(localStorage.getItem('auditTrail') || '[]'),
    notes: JSON.parse(localStorage.getItem('notes') || '{}'),
    selectedWeek: localStorage.getItem('selectedWeek'),
    courseStartDate: localStorage.getItem('courseStartDate')
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learning-portal-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

// Import user data
function importUserData(jsonData) {
  const data = JSON.parse(jsonData);
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      localStorage.setItem(key, 
        typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key])
      );
    }
  });
  window.location.reload(); // Refresh to load new data
}
```

#### Data Migration
When updating course structure:
1. **Backup existing data** before changes
2. **Update lesson IDs** if structure changes
3. **Migrate completed lessons** to new format
4. **Preserve time tracking** data
5. **Update audit trail** references

### Performance Optimization

#### Monitoring Performance
```javascript
// Check localStorage usage
function checkStorageUsage() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length;
    }
  }
  console.log(`localStorage usage: ${(total / 1024).toFixed(2)} KB`);
  return total;
}

// Monitor component render times
function measureRenderTime(componentName, renderFunction) {
  const start = performance.now();
  const result = renderFunction();
  const end = performance.now();
  console.log(`${componentName} render time: ${end - start} milliseconds`);
  return result;
}
```

#### Optimization Strategies
1. **Audit Trail Cleanup**: Limit to 100 most recent entries
2. **Notes Optimization**: Compress large text content
3. **Time Tracking**: Archive old session data
4. **Component Memoization**: Use React.memo for expensive components
5. **Lazy Loading**: Implement code splitting for large components

### Security Administration

#### Data Security
- **Local Storage Only**: No external data transmission
- **No Authentication**: No user credentials stored
- **Browser Isolation**: Data isolated per browser profile
- **HTTPS Recommended**: For production deployments

#### Security Best Practices
```javascript
// Input sanitization
function sanitizeInput(input) {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim() // Remove whitespace
    .substring(0, 1000); // Limit length
}

// Data validation
function validateLessonId(lessonId) {
  const pattern = /^\d+-\d+-\d+$/;
  return pattern.test(lessonId);
}

// Safe JSON parsing
function safeJsonParse(jsonString, defaultValue = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return defaultValue;
  }
}
```

### Deployment Administration

#### Development Deployment
```bash
# Start development server
npm start

# Build for production
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000
```

#### Production Deployment Options

**Static Hosting (Recommended)**:
```bash
# Build production version
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=build

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

**Docker Deployment**:
```dockerfile
# Dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Server Configuration**:
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Monitoring and Maintenance

#### Health Checks
```javascript
// Application health check
function performHealthCheck() {
  const checks = {
    localStorage: typeof Storage !== "undefined",
    react: typeof React !== "undefined",
    routing: window.location.pathname !== undefined,
    data: localStorage.getItem('completedLessons') !== null
  };
  
  const healthy = Object.values(checks).every(check => check);
  console.log('Health check:', healthy ? 'PASS' : 'FAIL', checks);
  return healthy;
}

// Performance monitoring
function monitorPerformance() {
  const navigation = performance.getEntriesByType('navigation')[0];
  console.log('Page load time:', navigation.loadEventEnd - navigation.fetchStart, 'ms');
  
  const resources = performance.getEntriesByType('resource');
  console.log('Resource count:', resources.length);
  
  const memory = performance.memory;
  if (memory) {
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}
```

#### Maintenance Tasks

**Daily**:
- Monitor application performance
- Check for JavaScript errors in logs
- Verify data persistence functionality

**Weekly**:
- Review localStorage usage
- Clean up old audit trail entries
- Check for browser compatibility issues

**Monthly**:
- Update npm dependencies
- Review and optimize performance
- Backup configuration files
- Test disaster recovery procedures

#### Troubleshooting Guide

**Common Issues and Solutions**:

1. **Application Won't Start**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Check Node.js version
   node --version # Should be 14+
   ```

2. **Build Failures**
   ```bash
   # Check for syntax errors
   npm run build 2>&1 | grep -i error
   
   # Update dependencies
   npm update
   
   # Clear build cache
   rm -rf build
   npm run build
   ```

3. **Data Loss Issues**
   ```javascript
   // Check localStorage availability
   if (typeof(Storage) === "undefined") {
     console.error("localStorage not supported");
   }
   
   // Verify data integrity
   const data = localStorage.getItem('completedLessons');
   if (!data || data === 'undefined') {
     console.warn("Data corruption detected");
     // Restore from backup
   }
   ```

4. **Performance Problems**
   ```javascript
   // Monitor memory usage
   setInterval(() => {
     if (performance.memory) {
       const used = performance.memory.usedJSHeapSize / 1048576;
       if (used > 100) { // 100MB threshold
         console.warn("High memory usage:", used + "MB");
       }
     }
   }, 30000);
   ```

### Backup and Recovery

#### Automated Backup Strategy
```javascript
// Scheduled backup function
function scheduleBackups() {
  setInterval(() => {
    const data = exportUserData();
    // Store in IndexedDB or send to backup service
    console.log('Automated backup completed');
  }, 24 * 60 * 60 * 1000); // Daily backups
}

// Recovery verification
function verifyBackup(backupData) {
  const required = ['completedLessons', 'timeTracking', 'auditTrail'];
  const valid = required.every(key => backupData.hasOwnProperty(key));
  
  if (!valid) {
    throw new Error('Invalid backup data structure');
  }
  
  return true;
}
```

#### Disaster Recovery Plan
1. **Identify Issue**: Determine scope of data loss
2. **Stop Application**: Prevent further data corruption
3. **Restore from Backup**: Import most recent valid backup
4. **Verify Integrity**: Check all data structures
5. **Resume Operation**: Restart application
6. **Monitor**: Watch for recurring issues

### Support and Documentation

#### Log Management
```javascript
// Enhanced logging system
const Logger = {
  info: (message, data) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  },
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
    // Could send to error tracking service
  }
};
```

#### User Support Procedures
1. **Collect Information**: Browser, OS, error messages
2. **Reproduce Issue**: Try to replicate the problem
3. **Check Logs**: Review console for errors
4. **Provide Solution**: Step-by-step resolution
5. **Follow Up**: Ensure issue is resolved

#### Documentation Updates
- Keep README.md current with latest features
- Update API documentation for any changes
- Maintain changelog for version tracking
- Document configuration changes
- Update troubleshooting guides

This administration guide provides comprehensive coverage of system management, deployment, monitoring, and maintenance procedures for the Personal AI Learning Portal.
