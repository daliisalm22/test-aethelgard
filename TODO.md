# AETHERGARD Upgrade — Task Checklist

## Architecture / Foundation
- [x] Analyze existing codebase (index.html, style.css, script.js, images)
- [x] Create centralized `state` object (selectedStar, holdProgress, selectedCategory, starGlowColor, motionActive, audio)
- [x] Data-driven star entries (id, name, message, category, color, image, createdAt)
- [x] localStorage persistence (stars, glow color, audio prefs)

## Features
- [x] 1. Delete — confirmation modal, animated removal, persisted
- [x] 2. Custom Glow Color — global color picker updates all star glows instantly
- [x] 3. Categories — filter pills (All, Memories, Ideas, Achievements) with animation
- [x] 4. Better Background — deep-space gradient, nebula, slow particles
- [x] 5. Images — per-entry image in details view, aspect ratio, lazy load, fallback
- [x] 6. Press-and-Hold — 3s real-time timer, brightness/scale, radial progress, sounds, cancel on early release
- [x] 7. Device-Motion controls — gyro with damping, permission flow, desktop pointer fallback
- [x] 8. Audio Manager — ambient music, hold/confirm/category/delete/details sounds + music/SFX/volume controls

## Engineering
- [x] Consolidated CSS (removed duplicate rules)
- [x] Pointer Events (tap vs drag vs hold)
- [x] Single animate loop, no duplicate listeners
- [x] prefers-reduced-motion support
- [x] Graceful fallbacks (images, motion, audio)
- [x] ~60 FPS (capped particles, rAF pooling)

## Testing
- [x] Serve via local server (http://localhost:8000)
- [x] Verify all assets return 200 (index, script, style, images, audio)
- [x] Verify all JS-queried element IDs exist in HTML
- [x] Syntax check passed (node --check, exit 0)
- [x] Verify all CSS classes/variables referenced by JS exist
- [x] App loads in browser without errors (assets fetched successfully)
- [x] Responsive media queries present
- [x] Reduced-motion support present
</content>
