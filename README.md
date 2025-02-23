# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3923f859-5de7-429d-b09a-7e8f16b14485

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3923f859-5de7-429d-b09a-7e8f16b14485) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

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

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3923f859-5de7-429d-b09a-7e8f16b14485) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)


```

### Deployment Instructions

1. **Install Supabase CLI** (if not already installed):
   ```sh
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```sh
   npx supabase login
   ```

3. **Link Your Project**:
   ```sh
   npx supabase link --project-ref ktmqwhkywxogxktuqcfx
   ```

4. **Deploy the Functions**:
   ```sh
   npx supabase functions deploy create-checkout --project-ref ktmqwhkywxogxktuqcfx
   npx supabase functions deploy shipping --project-ref ktmqwhkywxogxktuqcfx
   ```

5. **Set Environment Variables**:
   ```sh
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_51Qo5AED5AuH6As8BXyi78HRoRs766g3mxTeBTIzKt4gVfaSPxrMMtzqPrWfTozlRIVgg2O26jFTaqjLp7NBJAHGq00JEZDUhcV --project-ref ktmqwhkywxogxktuqcfx
   npx supabase secrets set SHIPPO_API_KEY=shippo_test_e7f0b7714d8b67b554393749c3c9b91c9a89cc28 --project-ref ktmqwhkywxogxktuqcfx
   ```

By following these steps, you will have address auto-completion implemented using Shippo in your Supabase serverless functions. The frontend will fetch and display address suggestions as the user types, and the selected suggestion will be used to validate the full address.