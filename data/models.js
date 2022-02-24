// Define coordinates
const triangle = {
  model: new Float32Array([-1, -0.7, 0, 0.8, 1, -0.7]),
  triangleCount: 1
};

const ship = {
  model: new Float32Array([-0.4, -1, 0, 1, 0, -0.5, 0.4, -1, 0, 1, 0, -0.5]),
  modelAndColor: new Float32Array([
    -0.5, -1, 0.26, 0.66, 0.49, 0, 1, 0.26, 0.66, 0.49, 0, -0.5, 0.26, 0.66,
    0.49, 0.5, -1, 0.26, 0.66, 0.49, 0, 1, 0.26, 0.66, 0.49, 0, -0.5, 0.26,
    0.66, 0.49
  ]),
  triangleCount: 2
};

export {triangle, ship};
