# TubeLinkr - Cloudflare-Powered Link Management

A modern link shortening and analytics platform built entirely on Cloudflare's ecosystem.

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## Features

- Clean, memorable short links for YouTube creators
- Real-time click tracking and analytics
- User authentication with JWT tokens
- Responsive dark-themed UI
- Fast global CDN delivery

## Setup

### 1. Prerequisites
- Node.js 18+
- Cloudflare account
- Cloudflare Wrangler CLI

### 2. Database Setup

Create a D1 database and run the schema:

```bash
# Create D1 database
wrangler d1 create tubelinkr-db

# Run schema migrations
wrangler d1 execute tubelinkr-db --file=./cloudflare-schema.sql
```

### 3. Environment Variables

Create `.env` file:

```env
VITE_CLOUDFLARE_API_BASE=https://api.cloudflare.com/client/v4
VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
VITE_CLOUDFLARE_DATABASE_ID=your-d1-database-id
VITE_CLOUDFLARE_API_TOKEN=your-api-token
```

### 4. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 5. Deployment

```bash
# Deploy to Cloudflare Pages
npm run build
npx wrangler pages deploy dist

# Or deploy Workers API
npx wrangler deploy
```

## Database Schema

The application uses three main tables:

- **users**: User accounts and authentication
- **links**: Short URLs and their destinations
- **click_events**: Click tracking and analytics

See `cloudflare-schema.sql` for the complete schema.

## API Endpoints

The Cloudflare Workers API provides:

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/links` - Get user's links
- `POST /api/links` - Create new link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link
- `GET /:username/:slug` - Redirect to original URL

## Performance

- Global edge caching with Cloudflare CDN
- Server-side rendering with Workers
- Optimized bundle size (~227KB gzipped)
- Fast D1 database queries

## Security

- JWT-based authentication
- SQL injection protection with parameterized queries
- Rate limiting on API endpoints
- HTTPS-only deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
