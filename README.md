# Expense-Tracker-
Expense Tracker | React Native, Expo, Node.js, Express.js, PostgreSQL, Clerk

# 📁 .env Setup
# ⚙️ Backend (/backend)
PORT=5001
NODE_ENV=development

CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
CLERK_SECRET_KEY=<your_clerk_secret_key>

DATABASE_URL=<your_neon_postgres_connection_url>

REDIS_URL=<your_redis_connection_url>

# ⚙️ Backend (/backend)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_clerk_key>

# ⚙️ Run the backend
cd backend
npm install
npm run dev

# 📱 Run the mobile
cd mobile
npm install
npx expo start



