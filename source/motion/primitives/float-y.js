export function floatY({ object, base, time, angularSpeed, amplitude }) {
  object.position.y = base + Math.sin(time * angularSpeed) * amplitude;
}
