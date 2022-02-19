// Define coordinates
const triangle = {
  model: new Float32Array([-1,-.7, 0,.8, 1,-.7]),
  triangleCount: 1
};

const ship = {
  model: new Float32Array([
    -.4, -1, 0, 1, 0, -.5,
    .4, -1, 0, 1, 0, -.5
  ]),
  modelAndColor: new Float32Array([
    -.4, -1,  1, 1, 1,
    0, 1,     0, 1, 1,
    0, -.5,   1, 1, 1,
    .4, -1,   1, 1, 1,
    0, 1,     0, 1, 1,
    0, -.5,   1, 1, 1
  ]),
  triangleCount: 2
};

export {
  triangle,
  ship
};