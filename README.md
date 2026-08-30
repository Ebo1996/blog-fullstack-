# Eventify Ethiopia 🇪🇹

A modern event ticketing platform built for Ethiopia, featuring Chapa payment integration and comprehensive event management capabilities.

![Event Platform](https://img.shields.io/badge/Platform-Event%20Ticketing-blue)
![Payment](https://img.shields.io/badge/Payment-Chapa-green)
![Ethiopia](https://img.shields.io/badge/Market-Ethiopia-red)

## 🚀 Features

### For Event Organizers
- **Event Management** - Create, edit, and publish events with rich details
- **Ticket Types** - Multiple ticket types with different pricing and availability
- **Real-time Analytics** - Track sales, revenue, and attendee data
- **Attendee Management** - Export attendee lists and manage check-ins
- **Refund Processing** - Handle refunds directly through Chapa
- **File Uploads** - Event images and organizer profiles

### For Attendees  
- **Event Discovery** - Browse and search events by category, location, and date
- **Secure Payments** - Pay with Chapa (Telebirr, bank transfers, cards)
- **Digital Tickets** - QR code tickets with instant delivery
- **Ticket Management** - View, transfer, and manage purchased tickets
- **Email Notifications** - Order confirmations and ticket delivery

### Technical Features
- **Chapa Integration** - Ethiopian payment gateway with ETB support
- **Email Notifications** - Powered by Resend with beautiful HTML templates
- **File Storage** - Supabase Storage for images and media
- **Rate Limiting** - Protection against spam and abuse
- **Row Level Security** - Secure data access with Supabase RLS
- **Real-time Updates** - Live data synchronization

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Supabase Auth** - Authentication and user management
- **React Hook Form** - Form handling with validation
- **Lucide Icons** - Modern icon library

### Backend
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - User authentication and authorization  
- **Supabase Storage** - File storage and CDN
- **Row Level Security** - Database-level security policies

### Integrations
- **Chapa** - Ethiopian payment gateway
- **Resend** - Email delivery service
- **Supabase Storage** - File uploads and management

## 📁 Project Structure

```
eventify-ethiopia/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   ├── lib/       # Utilities and configurations
│   │   └── services/  # API and business logic
│   └── package.json
├── backend/           # Database and migrations
│   └── supabase/
│       ├── migrations/# Database schema migrations
│       └── seed.sql   # Sample data
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- Chapa account (Ethiopian payment gateway)
- Resend account (optional, for emails)

### 1. Clone Repository
```bash
git clone https://github.com/Ebo1996/eventify-ethiopia.git
cd eventify-ethiopia
```

### 2. Setup Database
```bash
cd backend
supabase link --project-ref your-project-ref
supabase db push
```

### 3. Environment Variables
Create `frontend/.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Chapa (Ethiopian Payment Gateway)
CHAPA_SECRET_KEY=CHASECK_TEST-your-test-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Optional)
RESEND_API_KEY=re_your-api-key
```

### 4. Install & Run
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to see your event platform! 🎉

## 🔧 Configuration

### Chapa Setup (Required)
1. Create account at [dashboard.chapa.co](https://dashboard.chapa.co)
2. Get your API keys (test/live)
3. Configure webhook URL: `https://yourdomain.com/api/webhooks/chapa`

### Email Setup (Optional)
1. Create account at [resend.com](https://resend.com)
2. Get API key
3. Configure `RESEND_API_KEY` in environment

### Storage Setup (Optional)
1. Enable Supabase Storage in your project
2. Buckets are created automatically via migrations
3. Upload event images and user avatars

## 🚀 Deployment

### Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy! 🚀

### Environment Variables for Production
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CHAPA_SECRET_KEY=CHASECK-your-live-key  # Use LIVE key in production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
RESEND_API_KEY=re_your-api-key
```

## 📱 Screenshots

*Add screenshots of your event platform here*

## 🛡️ Security

- **Row Level Security (RLS)** - Database-level access control
- **Input Validation** - Zod schema validation on all forms
- **Rate Limiting** - API endpoint protection
- **Secure Headers** - Next.js security configuration
- **Environment Variables** - Sensitive data protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chapa** - Ethiopian payment gateway
- **Supabase** - Backend-as-a-Service platform
- **Vercel** - Deployment and hosting
- **Ethiopian Tech Community** - For inspiration and support

## 📞 Support

- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Check the `/backend` folder for API docs
- **Community** - Ethiopian developer community

---

**Built with ❤️ in Ethiopia** 🇪🇹

*Empowering Ethiopian event organizers with modern ticketing technology*