import * as THREE from "three";
import { world } from "./core.js";
import { applyDesignTokens } from "./tokens/apply.js";
import { createPlatforms } from "./components/platforms.js";
import { createColumns } from "./components/columns.js";
import { createActors } from "./components/actors.js";
import { createConnections } from "./components/connections.js";
import { createApplications } from "./components/applications.js";
import { createCity } from "./components/city.js";
import { createDataObjects } from "./components/data-objects.js";
import { createEarth } from "./components/earth.js";
import { createAtmosphere } from "./components/atmosphere.js";

function stabilizeTransparentRenderOrder() {
  world.traverse((object) => {
    if (!object.material) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const transparent = materials.filter((material) => material?.transparent);
    if (!transparent.length) return;

    const isOverlaySprite =
      object.isSprite && transparent.some((material) => material.depthTest === false);
    const isAdditive = transparent.some(
      (material) => material.blending === THREE.AdditiveBlending,
    );
    const isTransmissive = transparent.some(
      (material) => (material.transmission ?? 0) > 0,
    );

    // Three.js normally re-sorts transparent objects by camera-space depth every
    // frame. Large glass surfaces and animated glow particles can swap order as
    // their centers cross, which appears as one-frame flashes. Keep broad glass
    // first, regular alpha geometry next, additive glows above that, and labels
    // last so animation does not change the ordering bucket.
    object.renderOrder = isOverlaySprite
      ? 40
      : isAdditive
        ? 30
        : isTransmissive
          ? 10
          : 20;
  });
}

export function buildWorld() {
  applyDesignTokens();
  createPlatforms();
  createColumns();
  createActors();
  createConnections();
  createApplications();
  createCity();
  createDataObjects();
  createEarth();
  createAtmosphere();
  stabilizeTransparentRenderOrder();
}
