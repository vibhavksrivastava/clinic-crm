# Cron Job Setup for WhatsApp Reminders

## Vercel (Recommended for Next.js)

### 1. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### 2. Environment Variables
Add these to your Vercel project settings:
- `CRON_SECRET`: A secure random string for cron authentication
- `NEXT_PUBLIC_APP_URL`: Your deployment URL (e.g., `https://your-app.vercel.app`)

### 3. Cron Configuration
The `vercel.json` is already configured to run daily at 8 AM:
```json
{
  "crons": [
    {
      "path": "/api/cron/doctor-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Alternative Platforms

### Netlify Functions + Build Hooks
1. Create `netlify/functions/daily-reminders.js`
2. Set up a daily schedule using external cron service calling your Netlify function URL

### Railway/Render
Use their built-in cron job features to call:
```
POST https://your-app.com/api/appointments/send-reminders
```

### External Cron Services
- **Cron-Job.org**: Free, call your API endpoint
- **EasyCron**: Paid, more features
- **GitHub Actions**: Schedule workflows

Example curl command for external cron:
```bash
curl -X POST https://your-app.com/api/appointments/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Testing the Cron Job

### Manual Test
```bash
curl -X GET https://your-app.com/api/cron/doctor-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Local Testing
```bash
# Set environment variables
export CRON_SECRET="your-secret-here"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Test the endpoint
curl -X GET http://localhost:3000/api/cron/doctor-reminders \
  -H "Authorization: Bearer your-secret-here"
```

## Security Notes

- Always use `CRON_SECRET` to protect your cron endpoints
- Never commit secrets to code
- Monitor cron job execution in your platform's logs