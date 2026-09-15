export function orbitYaw({ view, dt, speed, updateCamera }) {
  view.yaw += dt * speed;
  updateCamera();
}
