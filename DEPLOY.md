# Deploy

Phase 1 ships to two services: PartyKit (game server) and Vercel (Next.js frontend). Both have free tiers.

## Prerequisites (one-time)

```bash
# GitHub CLI (already installed if `gh --version` works)
brew install gh
gh auth login

# Vercel CLI
npm install -g vercel
vercel login

# PartyKit doesn't need a separate global install — `npx partykit` reuses the local devDep
```

## Step 1: Push to GitHub

From `/Users/karankotai/dev/the-gang/`:

```bash
gh repo create the-gang --public --source=. --remote=origin --push
```

This creates a public repo at `github.com/<your-username>/the-gang` and pushes `main`.

If you want a private repo, use `--private` instead.

## Step 2: Deploy the PartyKit server

From `/Users/karankotai/dev/the-gang/`:

```bash
npx partykit deploy
```

First run will prompt for login (opens a browser). After deploy, the CLI prints the host URL — something like:

```
the-gang.<your-username>.partykit.dev
```

Copy that hostname. You'll paste it into Vercel as `NEXT_PUBLIC_PARTYKIT_HOST` in the next step.

## Step 3: Deploy the Vercel frontend

From `/Users/karankotai/dev/the-gang/`:

```bash
npx vercel --yes
```

Follow the prompts (link to your account / new project). After the first deploy completes:

1. Go to https://vercel.com/dashboard
2. Open the `the-gang` project → Settings → Environment Variables
3. Add:
   - **Key**: `NEXT_PUBLIC_PARTYKIT_HOST`
   - **Value**: `the-gang.<your-username>.partykit.dev` (from Step 2)
   - **Environments**: Production, Preview, Development (all three)
4. Trigger a redeploy: `npx vercel --prod`

## Step 4: Smoke test on the live URL

1. Open the Vercel URL in three browser windows (or two incognito + one regular).
2. In window 1, click "Create new room" → copy the URL.
3. Paste the URL into windows 2 and 3.
4. Set names, mark ready in all three, click "Start heist".
5. Walk through preflop → flop → turn → river → showdown → result.

If hole cards don't appear, check that `NEXT_PUBLIC_PARTYKIT_HOST` is set correctly in Vercel and that the PartyKit deploy succeeded.

## Local dev

```bash
# terminal 1
npm run party:dev

# terminal 2
npm run dev
```

Visit http://localhost:3000.

## Redeploy after code changes

```bash
git push                  # GitHub
npx partykit deploy       # PartyKit server
npx vercel --prod         # Vercel frontend
```

Vercel can also be set up to auto-deploy on `git push` if you connect the GitHub repo in the Vercel dashboard.
