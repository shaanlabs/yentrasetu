# YantraSetu 🚜 — Next-Gen AI Heavy Machinery Marketplace

YantraSetu is India's premier B2B marketplace for the buying, selling, renting, and management of heavy infrastructure equipment. Designed with a **Unified Marketplace Architecture**, it seamlessly bridges the gap between individual contractors and large fleet dealers while employing advanced AI models to ensure fair pricing and absolute trust.

---

## 🏆 Key Innovations & "Why This Wins"
While many projects focus on theoretical applications, YantraSetu solves a highly fragmented, multi-billion dollar problem in the real-world infrastructure sector by heavily integrating **Applied AI**.

1. **AI Smart Pricing Engine**: When sellers list machinery, our ML engine analyzes historical market data (make, model, year, hours used) to instantly generate a recommended "Fair Market Value," preventing price gouging.
2. **Fleet Optimization Algorithm**: Contractors can input project parameters, and the system dynamically calculates the exact optimal mix of machinery required to maximize ROI and minimize idle time.
3. **Sentiment-Based Trust Scores**: User reviews are processed via NLP to generate accurate Trust Scores for sellers, eliminating fraudulent listings.
4. **Unified RBAC Architecture**: Instead of clunky, separate apps for buyers and sellers, users seamlessly transition from Buyer to Verified Dealer through a strict, high-friction verification funnel (`/upgrade-account`).

---

## 🔒 Enterprise-Grade Security & Validation
To ensure maximum data integrity and prevent spam, YantraSetu enforces strict security measures on both the frontend and backend API layers:
- **Phone Validation**: Enforces exact 10-digit valid numbers (No fake sequences).
- **Email Validation**: Strict regex verification ensuring true email domains.
- **Password Complexity**: Requires a minimum of 8 characters, combining numbers and letters for robust hashing (bcrypt).
- **Role-Based Access Control (RBAC)**: Only verified "Dealers" and "Companies" can create equipment listings, strictly preventing end-customer clutter.

---

## 👑 Admin Panel & Testing Credentials
The Admin Dashboard gives full oversight over the platform. Admins can review pending user certifications (GST/Company documents), approve or reject machinery listings, and monitor global marketplace metrics.

### **How to access the Admin Dashboard:**
1. Navigate to the login page (`/login`)
2. Enter the following credentials:
   - **Phone Number:** `9999999999`
   - **Password:** `admin123` *(Note: in production, this is strictly hashed and rotated)*
3. Once logged in, click your profile avatar in the top right and select **"Admin Dashboard"**.

You will have access to:
- **Pending Approvals Queue**: Review users who have submitted requests to upgrade to Seller/Dealer tiers.
- **Global Listings**: View all active and pending machinery.
- **Platform Analytics**: Total transactions, active rentals, and AI-predicted trends.

---

## 💻 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (for fluid, modern animations).
- **Backend**: Node.js, Express, Sequelize ORM (PostgreSQL/SQLite).
- **AI Modules**: Custom TensorFlow.js pricing models.
- **UI System**: Custom Shadcn implementation with strict brand tokens (`#FF6A00` Accent, `#101214` Ink).

## 🚀 Getting Started

1. **Start the Backend server**:
   \`\`\`bash
   cd backend
   npm install
   npm run dev
   \`\`\`

2. **Start the Frontend client**:
   \`\`\`bash
   cd app
   npm install
   npm run dev
   \`\`\`

Open your browser to \`http://localhost:5173\` to experience the platform.
