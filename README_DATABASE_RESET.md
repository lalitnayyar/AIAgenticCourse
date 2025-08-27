# Firebase Database Reset Module

This module provides comprehensive tools for resetting and managing the Firebase database for the Learning Portal.

## ⚠️ IMPORTANT SAFETY WARNING

**This module contains destructive operations that can permanently delete data. Use with extreme caution, especially in production environments.**

## Components

### 1. Web Interface (`/reset` route)
- **Access**: Admin users only
- **Features**: 
  - Visual database reset panel
  - Safety checks and confirmations
  - Backup creation and restoration
  - User data reset (preserves system settings)
  - Complete database reset (destroys everything)

### 2. Command Line Interface (`scripts/resetDatabase.js`)
- **Access**: Direct server/development access
- **Features**:
  - Standalone script for database operations
  - Backup and restore functionality
  - Batch operations
  - Force mode for automated scripts

### 3. Core Reset Manager (`utils/firebaseReset.js`)
- **Features**:
  - Backup creation with timestamp
  - Collection-specific reset operations
  - Production environment protection
  - Audit trail logging

## Usage

### Web Interface
1. Login as admin user
2. Navigate to `/reset` in the portal
3. Follow the safety prompts and confirmations
4. Choose between user data reset or complete reset

### Command Line
```bash
# Show help
npm run reset-db --help

# Create backup only
npm run backup-db

# List available backups
npm run list-backups

# Reset user data only (preserves system settings)
npm run reset-users

# Complete database reset (DANGEROUS)
npm run reset-complete

# Direct script usage with options
node scripts/resetDatabase.js --user-data --force
node scripts/resetDatabase.js --restore backups/firebase_backup_2024-01-01.json
```

## Reset Types

### User Data Reset
- **Deletes**: Users, progress, notes, schedules
- **Preserves**: System settings, audit logs
- **Use Case**: Clean slate for users while keeping system configuration

### Complete Reset
- **Deletes**: Everything in the database
- **Use Case**: Complete fresh start or development environment reset

## Safety Features

### 1. Automatic Backups
- Created before any destructive operation
- Stored locally and in localStorage
- Timestamped for easy identification

### 2. Multiple Confirmations
- Checkbox confirmations for destructive operations
- Text-based confirmation for complete reset
- Production environment warnings

### 3. Environment Detection
- Automatic production environment detection
- Additional safety prompts for production
- Force mode bypass for automation

### 4. Audit Trail
- All reset operations are logged
- Includes timestamp, user, and operation details
- Stored in audit logs or localStorage as fallback

## Collections Managed

### User Collections (Reset with --user-data)
- `portal_users` - User authentication data
- `user_progress` - Learning progress tracking
- `user_notes` - User-created notes
- `user_schedules` - User schedules and planning

### System Collections (Reset only with --complete)
- `audit_logs` - System audit trail
- `settings` - Application settings and configuration

## Backup Format

Backups are stored as JSON files with the following structure:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "collections": {
    "portal_users": [
      {
        "id": "document_id",
        "data": { /* document data */ }
      }
    ]
  }
}
```

## Error Handling

- Network failures are handled gracefully
- Partial failures are reported with details
- Failed operations can be retried
- Backup corruption is detected and reported

## Development vs Production

### Development
- Fewer safety prompts
- Faster operations
- Local backup storage

### Production
- Multiple confirmation steps
- Enhanced logging
- Additional safety checks
- Automatic backup creation

## Integration with Portal

The reset functionality is integrated into the main portal:
- Admin-only access control
- Consistent UI/UX with portal theme
- Real-time status updates
- Integration with existing authentication system

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure admin privileges
   - Check Firebase authentication

2. **Backup Creation Fails**
   - Check network connectivity
   - Verify Firebase permissions
   - Check local storage space

3. **Reset Operation Hangs**
   - Check Firebase connection
   - Verify collection exists
   - Check for large datasets

### Recovery

1. **Accidental Reset**
   - Use restore functionality
   - Select most recent backup
   - Verify data integrity after restore

2. **Corrupted Database**
   - Use complete reset
   - Restore from known good backup
   - Recreate admin user if needed

## Best Practices

1. **Always Create Backups**
   - Before any destructive operation
   - Regular scheduled backups
   - Test restore procedures

2. **Use Appropriate Reset Type**
   - User data reset for user cleanup
   - Complete reset only when necessary
   - Consider partial collection resets

3. **Verify Operations**
   - Check console logs
   - Verify expected data removal
   - Test functionality after reset

4. **Document Changes**
   - Record reset operations
   - Note reasons for reset
   - Update team on changes

## Security Considerations

- Admin-only access to reset functionality
- Multiple confirmation steps prevent accidents
- Audit trail for accountability
- Production environment protection
- Backup encryption (future enhancement)

## Future Enhancements

- Scheduled automatic backups
- Cloud backup storage
- Selective collection reset
- Data migration tools
- Enhanced audit reporting
