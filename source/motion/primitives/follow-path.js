const modulo = (value, length = 1) => ((value % length) + length) % length;

export function followPath({ object, curve, time, speed, offset = 0 }) {
  object.position.copy(curve.getPoint(modulo(time * speed + offset, 1)));
}
