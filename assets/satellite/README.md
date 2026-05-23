# Satellite 3D Model Setup

The portfolio loads one OBJ model from:

```text
assets/satellite/Satellite.obj
```

Texture maps are applied manually in `js/satellite.js` from:

```text
assets/satellite/textures/BaseColor.jpg
assets/satellite/textures/Normal.jpg
assets/satellite/textures/Metallic.jpg
```

## Changing The Model

If you replace the OBJ file, either keep the filename as `Satellite.obj` or update `OBJ_PATH` in `js/satellite.js`.

## Tuning

The main controls live near the top of `js/satellite.js`:

| Constant | Effect |
|---|---|
| `CANVAS_SIZE` | Render canvas size |
| `CAMERA_Z` | Camera distance |
| `AUTO_ROTATE_SPD` | Idle rotation speed |
| `SCRUB_SPEED` | ScrollTrigger smoothing |

The scroll path is controlled by the `WAYPOINTS` profiles for desktop, tablet, and mobile.
