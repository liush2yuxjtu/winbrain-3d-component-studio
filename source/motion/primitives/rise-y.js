const modulo = (value, length = 1) => ((value % length) + length) % length;

export function riseY({ object, x, d, lo, hi, time, speed, offset = 0, pos }) {
  const progress = modulo(time * speed + offset, 1);
  object.position.copy(pos(x, lo + (hi - lo) * progress, d));
}
