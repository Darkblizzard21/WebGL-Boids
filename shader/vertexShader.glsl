#version 300 es
in vec2 position;
in vec2 oldVelocity;

uniform float deltaTime;
uniform vec2 allOldPositions[200];

out vec2 newVelocity;

void main() {
    newVelocity = oldVelocity + vec2(1,1);
}