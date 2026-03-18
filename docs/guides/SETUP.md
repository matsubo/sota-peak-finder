# Setup Guide

## 0. Database Setup (Important)

**Database files are not included in the repository.** You must set up the database before starting development.

### Quick Setup
```bash
# Install dependencies
bun install

# Setup database (automatic download + build)
bun run setup
```

### Manual Setup
```bash
# Download SOTA database
curl -L -o /tmp/sota-summits-worldwide.csv https://storage.sota.org.uk/summitslist.csv

# Build database
bun run build:sota

# Verify
ls -lh public/data/sota.db
```

### Pre-test Verification
```bash
# Check if database exists
if [ ! -f public/data/sota.db ]; then
  echo "⚠️  Database not found. Please run: bun run setup"
fi
```

---

## 1. Icon Generation

Generate icon images required for PWA.

```bash
# Open create-icons.html in browser
open create-icons.html
```

1. Open `create-icons.html` in your browser
2. Download `icon-192.png` and `icon-512.png`
3. Place the downloaded files in the project root directory

Alternatively, create 192x192 and 512x512 PNG images using your favorite icon creation tool.

## 2. Local Testing

Must run on HTTPS or localhost (Service Worker restriction).

### Using Python
```bash
python -m http.server 8000
```

### Using Node.js
```bash
npx serve
```

### Using PHP
```bash
php -S localhost:8000
```

Open `http://localhost:8000` in your browser to test.

## 3. Deploy to GitHub Pages

### 3-1. Create GitHub Repository

```bash
# Initialize Git repository
git init

# Add files
git add .

# Initial commit
git commit -m "Initial commit: Offline QTH PWA"

# Connect to GitHub repository (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/sota-peak-finder.git

# Push
git branch -M main
git push -u origin main
```

### 3-2. Enable GitHub Pages

1. Open your GitHub repository page
2. Click the `Settings` tab
3. Select `Pages` from the left menu
4. Select `main` branch in `Source`
5. Click `Save`

After a few minutes, it will be accessible at `https://YOUR_USERNAME.github.io/sota-peak-finder/`.

## 4. Verify manifest.json Configuration

Change the `start_url` in `manifest.json` to match your repository name.

```json
{
  "start_url": "/sota-peak-finder/"  // Match with repository name
}
```

If your repository name is different, change it accordingly.

## 5. Service Worker Path Configuration

Also check the paths in `service-worker.js`. GitHub Pages includes the repository name in the path.

## 6. Expand JCC/JCG Data

Add JCC/JCG data to `data/location-data.json`.

More detailed data improves accuracy.

### How to Add Data

```json
{
  "lat": 35.6895,         // Latitude
  "lon": 139.6917,        // Longitude
  "prefecture": "Tokyo",
  "city": "Chiyoda",
  "jcc": "1001",          // JCC code
  "jcg": "10001"          // JCG code
}
```

## Troubleshooting

### Service Worker Not Registering
- Verify running on HTTPS or localhost
- Check browser console for errors
- Clear browser cache

### Cannot Get Location
- Check browser location permission
- Verify running on HTTPS (production environment)
- Check device GPS settings

### Not Working Offline
- Access once while online to create cache
- Verify Service Worker is registered properly
- Check status in Application > Service Workers (Chrome DevTools)

### 404 Error on GitHub Pages
- Verify repository name matches manifest.json start_url
- Check branch name is correct
- Wait a few minutes and try again

## Development Tips

### Service Worker Debugging
Check status and uninstall in Chrome DevTools > Application > Service Workers

### Clear Cache
Chrome DevTools > Application > Storage > Clear site data

### Offline Testing
Check Offline in Chrome DevTools > Network to test
