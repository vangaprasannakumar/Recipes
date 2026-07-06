# My Recipes

A personal recipe app built as an installable Progressive Web App (PWA), backed by a Google Sheet instead of a traditional database. Includes AI-powered recipe extraction — paste a YouTube cooking video link and it fills in the title, ingredients, and steps automatically.

No build tools, no framework, no server to maintain beyond a Google Apps Script deployment. Just static files + a Google Sheet.

---

## Features

- **Browse, search, and filter** recipes by title or ingredient, with category and sort filters that only appear if your sheet actually has that data
- **Favorites** with a dedicated filter view
- **Recipe detail view** with ingredient photos, step-by-step process, and an embedded YouTube video
- **Cooking-mode timers** on each process step, with sound + phone notification when time's up
- **Add Recipe page** with YouTube auto-fill — Gemini watches the video and extracts the recipe as structured data for you to review before saving
- **Installable PWA** — works offline, add-to-home-screen, background update checks with an in-app "Update available" banner
- **Deep links** — every recipe has its own shareable URL
- **Wake Lock** — keeps the screen on while a recipe is open so cooking timers stay accurate

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Single-file HTML/CSS/vanilla JS — no framework, no build step |
| Backend | Google Apps Script, bound to a Google Sheet |
| Database | Google Sheets (one row per recipe) |
| AI extraction | Google Gemini API (`gemini-2.5-flash`), called server-side from Apps Script |
| Offline/installable | Web App Manifest + Service Worker |

---

## File Structure

```
├── index.html        Main app — browse, search, favorites, recipe detail, timers
├── add-recipe.html   Add a new recipe, with YouTube → Gemini auto-fill
├── Code.gs           Apps Script backend (reads/writes the sheet, calls Gemini)
├── manifest.json     PWA manifest (install metadata, icons, shortcuts)
└── sw.js             Service worker (offline caching, update detection)
```

All five files are deployed together — `index.html` and `add-recipe.html` both call the same Apps Script Web App URL.

---

## Google Sheet Schema

One tab named **Recipes**, with a header row. Required columns:

| Column | Type | Notes |
|---|---|---|
| `RecipeID` | text | Unique ID. Auto-generated (UUID) when adding via the app |
| `Title` | text | |
| `Thumbnail_URL` | text | Image URL — auto-filled from the YouTube thumbnail when using Add Recipe |
| `YouTube_ID` | text | Just the video ID, not the full URL |
| `Prep_Time` | text | Free text, e.g. `"20 mins"` |
| `Ingredients` | text | JSON array string, e.g. `[{"name":"Rice","qty":"2 cups"}]` |
| `Process_Steps` | text | JSON array string, e.g. `[{"step":"Wash the rice"}]` |

Optional columns (only shown in the app if present):

| Column | Enables |
|---|---|
| `Category` | Category filter/sort on the home screen, shown in Add Recipe |
| `Servings` | Shown in the recipe detail meta row |
| `Cook_Time` | Shown in the recipe detail meta row |

Both `Code.gs` and the frontend read headers **dynamically** — add or rename optional columns any time without touching code.

---

## Setup

### 1. Google Sheet
Create a sheet with a **Recipes** tab and the header row above.

### 2. Apps Script backend
- In the Sheet: **Extensions → Apps Script**
- Replace the default code with `Code.gs`
- **One-time authorization:** select `authorizeExternalRequests` in the function dropdown → click **Run** → approve the permission prompt (needed because the script calls the Gemini API)
- **Deploy:** Deploy → New deployment → type **Web app** → Execute as **Me** → Who has access **Anyone** → Deploy
- Copy the `/exec` URL — you'll need it in step 4

### 3. Gemini API key
- Get a free key at [aistudio.google.com](https://aistudio.google.com)
- In the Apps Script editor: **Project Settings → Script Properties** → add a property named `GEMINI_API_KEY` with your key as the value

### 4. Point the frontend at your deployment
In both `index.html` and `add-recipe.html`, update:
```js
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 5. Host the static files
Upload `index.html`, `add-recipe.html`, `manifest.json`, and `sw.js` to any static host (GitHub Pages, Netlify, etc.) — all in the same folder.

### 6. Install on your phone
Open the hosted URL → tap the in-app **Install** button (or your browser's "Add to Home Screen").

---

## Using It

- **Home screen:** search, filter by favorites/category, sort by name or prep time
- **Add a recipe:** tap the **+** in the header → paste a YouTube link → **Fill** → review/edit every field → **Save Recipe**
- **Cooking mode:** open a recipe → Process tab → set minutes on any step → tap play — you'll get a beep, a vibration, and a phone notification when it's done
- **Test the alarm sound** anytime via the "Test Alarm Sound" button at the top of the Process tab
- **Refresh:** tap the header's refresh icon to pull the latest recipes (e.g. one added from another phone) and check for app updates in one tap

---

## Updating the App After Code Changes

- **`index.html` / `add-recipe.html` / `manifest.json` / `sw.js`:** just re-upload to your host. Installed phones will detect it automatically (background check on open, or tap the header refresh button) and show an **Update available** banner — tap it to reload.
- **`Code.gs`:** re-upload isn't enough on its own — you must also go to **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**, since the live `/exec` URL is tied to a specific deployed version.
- **Bump `CACHE_NAME`** in `sw.js` any time you change cached assets or the caching strategy — that's what triggers old caches to clear on the next update.

---

## Known Limitations

- **Favorites are per-device.** They're stored in `localStorage`, not the sheet — not yet synced across phones.
- **Gemini extraction quality depends on the video.** It reads quantities/steps from what's actually shown or spoken, and leaves fields blank rather than guessing — always review before saving.
- **Only public YouTube videos** work for auto-fill (not private/unlisted).
- **True background timers aren't possible in a web app.** Wake Lock keeps the screen on to keep timers accurate while a recipe is open, but fully backgrounding the phone for the whole timer duration isn't reliable.
- **Mobile audio can be blocked by OS-level silent mode / media volume**, independent of the app — the built-in "Test Alarm Sound" button helps isolate whether that's the cause.
- **Maskable icon / locally-hosted icons** in `manifest.json` are pending — needs the raw logo file to generate a padded version.

---

## Possible Future Additions

- Cross-device favorites sync (via the sheet, through the existing `doPost` hook)
- Share Recipe button (Web Share API)
- Voice-guided steps (read the current step aloud)
- "Surprise Me" random recipe button
- Backup/restore favorites as a JSON export
- Swap the synthesized alarm beep for a real uploaded audio file (`CUSTOM_ALARM_SOUND_URL` in `index.html` is ready for this)

---

## Credits

Built with Google Sheets, Google Apps Script, the Gemini API, vanilla JavaScript, and Font Awesome icons.
