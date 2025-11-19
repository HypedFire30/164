# 164 PFS Automation System

A modern, automated Personal Financial Statement (PFS) generation platform for 164 Investments. This system replaces manual Google Sheets workflows with a centralized database-driven solution.

## Features

- **Centralized Data Storage**: All properties, mortgages, assets, and liabilities stored in Airtable
- **Automated Calculations**: Real-time totals, equity, and net worth calculations
- **Easy Updates**: Simple forms for updating property values and mortgage balances monthly
- **PFS Generation**: Generate lender-ready PDF statements (coming soon)
- **Modern UI**: Clean, responsive interface built with React and shadcn/ui

## Quick Start

1. **Set up Airtable**: Follow the detailed instructions in [SETUP.md](./SETUP.md)
2. **Install dependencies**: `npm install`
3. **Configure environment**: Create a `.env` file with your Airtable credentials
4. **Run the app**: `npm run dev`

See [SETUP.md](./SETUP.md) for complete setup instructions.

## How can I edit this code?

You can edit this code using your preferred IDE or directly in GitHub.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project can be deployed to Vercel, Netlify, or any static hosting service that supports Vite applications.

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect it's a Vite project
4. Add your environment variables (`VITE_AIRTABLE_API_KEY` and `VITE_AIRTABLE_BASE_ID`)
5. Deploy!

The `vercel.json` configuration file is already included in this repository.
