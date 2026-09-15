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
}
