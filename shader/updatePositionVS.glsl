#version 300 es
in vec2 oldPosition;
in vec2 velocity;

uniform float deltaTime;
uniform vec2 canvasDimensions;
uniform vec2 allOldPositions[200];

out vec2 newPosition;

vec2 euclideanModulo(vec2 n, vec2 m) {
    return mod(mod(n, m) + m, m);
}

void main() {
    vec2 test = normalize(oldPosition - vec2(canvasDimensions.x/2,canvasDimensions.y/2));
    newPosition = euclideanModulo(
    oldPosition + (velocity) * deltaTime,
    canvasDimensions);
}