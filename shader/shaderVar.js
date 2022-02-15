// Write vertex shaders
const vertexShader = `#version 300 es
precision mediump float;

uniform float scale;
uniform vec2 position;
in vec2 vertexPos;

void main () {
    gl_Position = vec4(position.x + vertexPos.x * scale, position.y + vertexPos.y * scale, 0.0, 1.0); // x,y,z,w
}
`;

// Write fragment shaders
const fragmentShader = `#version 300 es
precision mediump float;
out vec4 color;

void main () {
    color = vec4(0.7, 0.89, 0.98, 1.0);
}
`;


const updateVelocityVS = `#version 300 es
  in vec2 position;
  in vec2 oldVelocity;

  uniform float deltaTime;
  uniform vec2 allOldPositions[200];

  out vec2 newVelocity;

  void main() {
    newVelocity = oldVelocity + vec2(10,1);
  }
  `;

const updatePositionVS = `#version 300 es
   in vec2 oldPosition;
  in vec2 velocity;

  uniform float deltaTime;
  uniform vec2 canvasDimensions;

  out vec2 newPosition;

  vec2 euclideanModulo(vec2 n, vec2 m) {
  \treturn mod(mod(n, m) + m, m);
  }

  void main() {
    newPosition = euclideanModulo(
        oldPosition + velocity * deltaTime,
        canvasDimensions);
  }
  `;

const emptyFS = `#version 300 es
  precision highp float;
  void main() {
  }
  `;

const drawParticlesVS = `#version 300 es
  in vec4 position;
  uniform mat4 matrix;

  void main() {
    // do the common matrix math
    gl_Position = matrix * position;
    gl_PointSize = 10.0;
  }
  `;

const drawParticlesFS = `#version 300 es
  precision highp float;
  out vec4 outColor;
  void main() {
    outColor = vec4(1, 0, 0, 1);
  }
  `;

export {
  vertexShader,
  fragmentShader,
  updateVelocityVS,
  updatePositionVS,
  emptyFS,
  drawParticlesVS,
  drawParticlesFS
}