# Sandy Times

A clock that dissolves into sand.

The current time is rendered as a heightmap and fed into a WebGL fragment shader, where text luminance drives surface displacement. Two independent normal maps are computed using finite differences — one for the water surface, one for the sand grain layer — and composited together using a physically-inspired lighting model. Caustic light patterns and chromatic aberration are applied as a final pass.

To avoid unnecessary GPU work, the simulation only redraws when the second changes.

**[→ kivilcimlab.org/sandy-times](https://kivilcimlab.org/sandy-times)**

---

## How it works

The digits are first rendered to a 2D canvas at high contrast. That canvas is read as pixel data and uploaded to the GPU as a texture. In the fragment shader, each pixel samples its luminance and uses it as a displacement value, pushing geometry up or down to form the carved-letter effect.

The dual normal map approach is what gives the surface its material richness — sand and water behave differently under the same lighting model, so they're calculated separately and blended.

```
Text → 2D Canvas → luminance heightmap → WebGL texture
                                        ↓
                         normal map A (water ripple)
                       + normal map B (sand grain)
                       + caustic light field
                       + chromatic aberration
                       = final frame (rendered on second tick only)
```

## Toggle

The **HIDE TIME** button removes the digit overlay entirely, leaving the simulation running as a generative piece. The minimap in the bottom-right corner stays visible as a navigation anchor.

## Stack

- Vanilla JS + WebGL (no library)
- Fragment shader written in GLSL
- 2D Canvas API for text rasterization
