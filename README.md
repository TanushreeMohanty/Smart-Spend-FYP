# SmartSpend Pro 🇮🇳

**Version:** v5.3.0  
**Type:** Final Year Project (FYP)

A comprehensive Personal Finance PWA tailored for the Indian market, featuring AI-driven tax audits and bank statement parsing.

## 🚀 Features

- **🇮🇳 Indian Tax Engine:** Calculates liability under Old & New Regimes (80C, 80D, HRA, etc.).
- **🤖 AI Advisor:** Gemini-powered insights for monthly spending and tax planning.
- **📄 Statement Parsing:** OCR & PDF support for SBI, HDFC, ICICI, Axis, and Citi statements.
- **💰 Wealth Tracking:** Real-time Net Worth calculation (Assets - Liabilities).
- **📱 Offline Ready:** Built as a PWA with Firebase persistence.

---

## 🛠️ Developer Workflow (Git commands)

### 📋 Branch Naming Rules
*Please use these prefixes when creating branches:*
* **New Features:** `feature/your-feature-name` (e.g., `feature/login-page`)
* **Bug Fixes:** `fix/issue-name` (e.g., `fix/login-error`)

---

### For Repo Creator (Tanu)

#### A. Initial Setup (One-time only)
- 1. Clone your repository
```git clone https://github.com/TanushreeMohanty/Smart-Spend-FYP.git```

- 2. Enter the directory
```cd Smart-Spend-FYP```

#### B. Reviewing & Merging Code 
(Run this when a team member has finished a task.)

- 1. Get the latest updates from GitHub
```git fetch origin```

- 2. Switch to the team member's branch to test their code
```git checkout team-member-branch-name```

- 3. ... Test the app to ensure it works ...
```npm run dev```

- 4. If it works, switch back to main
```git checkout main```

- 5. Merge their work into the main code
```git merge team-member-branch-name```

- 6. Push the updated main code to GitHub
```git push origin main```

### For team members (Rohin & Shubham)

#### A. Initial Setup (One-time only)
- 1. Clone your repository
```git clone https://github.com/TanushreeMohanty/Smart-Spend-FYP.git```

- 2. Enter the directory
```cd Smart-Spend-FYP```

#### B. Daily Work Cycle
- 1. VITAL: Switch to main and get the latest code
```git checkout main```
```git pull origin main```

- 2. Create a new branch for your task (Replace 'feature/login-page' with your actual task name)
```git checkout -b feature/login-page```

- 3. ... Write your code and make changes ...

- 4. Save your changes locally
```git add .```
```git commit -m "Description of what you added"```

- 5. Upload your branch to GitHub
```git push origin feature/login-page```

#### C. Finalizing (Pull Request)
- 1. Go to the GitHub Repository.

- 2. You will see a banner saying "Compare & pull request".

- 3. Click it, write a short title, and click Create Pull Request to notify the Owner.















