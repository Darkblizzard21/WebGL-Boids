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
    -.5, -1,  .26, .66, .49,
    0, 1,     .26, .66, .49,
    0, -.5,   .26, .66, .49,
    .5, -1,   .26, .66, .49,
    0, 1,     .26, .66, .49,
    0, -.5,   .26, .66, .49,
  ]),
  triangleCount: 2
};

export {
  triangle,
  ship
};