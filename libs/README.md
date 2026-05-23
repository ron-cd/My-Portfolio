# libs/ - Local Library Files

This folder must contain these 4 files before the portfolio will work locally.

## Download Script

Run one of the root-level scripts from inside the project folder:

```powershell
PowerShell -ExecutionPolicy Bypass -File download-libs.ps1
```

```bash
bash download-libs.sh
```

## Manual Download

| Filename | URL |
|---|---|
| `gsap.min.js` | https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js |
| `ScrollTrigger.min.js` | https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js |
| `three.min.js` | https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js |
| `OBJLoader.js` | https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js |

## Expected Files

```text
libs/
├── gsap.min.js
├── ScrollTrigger.min.js
├── three.min.js
└── OBJLoader.js
```
