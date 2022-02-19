import React, {useEffect, useRef} from "react";
import WebGLUtil from "./utils/WebGL";
import "./WEbGLCanvas.scss";
import {
  drawParticlesFS, drawParticlesInstancedFS,
  drawParticlesInstancedVS,
  drawParticlesVS,
  emptyFS,
  updatePositionVS,
  updateVelocityVS
} from "./shader/shaderVar";
import {ship, triangle} from "./models";

const webGL = new WebGLUtil();


const vs = `#version 300 es
precision mediump float;

in vec2 i_velocity;
in vec2 i_offset;
in vec2 a_position;
in vec3 a_color;

out vec4 v_color;

float angleBetween(vec2 first, vec2 second){
    return acos(dot(first,second)/(length(first)*length(second)));
}
  
vec2 rotate(vec2 origin, float rad){
    float x = cos(rad)*origin.x - sin(rad) * origin.y;
    float y = sin(rad)*origin.x + cos(rad) * origin.y;
    return vec2(x, y);
}

void main () {
    float angle = angleBetween(vec2(0,1),i_velocity);
    gl_Position = vec4(i_offset + rotate(a_position,angle),0,1); // x,y,z,w
    v_color = vec4(a_color,1);
}
`;

const fs = `#version 300 es
precision mediump float;

out vec4 color;

in vec4 v_color;

void main () {
    color = v_color;
}`;

let WebGLDebugUtil = require("webgl-debug");

export default function Test() {
  const canvas = useRef();

  useEffect(() => {
    console.log("prepare rendering");
    webGL.resizeCanvasToDisplaySize(canvas.current);

    function throwOnGLError(err, funcName, args) {
      throw WebGLDebugUtil.glEnumToString(err)
      + " was caused by call to "
      + funcName;
    };

    const gl = WebGLDebugUtil.makeDebugContext(webGL.getGLContext(canvas.current), throwOnGLError);

    // create GLSL shaders, upload the GLSL source, compile the shaders

    // Link the two shaders into a program
    var program = webGL.createProgram(gl, [vs, fs]);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    var offsetAttributeLocation = gl.getAttribLocation(program, "i_offset");
    var velocityAttribLoc = gl.getAttribLocation(program, "i_velocity");

    // Create a buffer and put three 2d clip space points in it
    var attributeBuffer = gl.createBuffer();

    let modelData = new Float32Array([
      -.4, -1,  1, 1, 1,
      0, 1,     0, 1, 1,
      0, -.5,   1, 1, 1,
      .4, -1,   1, 1, 1,
      0, 1,     0, 1, 1,
      0, -.5,   1, 1, 1
    ]);

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 20, 8);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);

    var instanceBuffer = gl.createBuffer();

    let instanceData = new Float32Array([
      -0.5, 0, 0.5, -0.5,
      0.5, 0, 0, 1
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(offsetAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(velocityAttribLoc, 2, gl.FLOAT, false, 16, 8);
    gl.vertexAttribDivisor(offsetAttributeLocation,1);
    gl.vertexAttribDivisor(velocityAttribLoc,1);
    // Turn on the attribute
    gl.enableVertexAttribArray(offsetAttributeLocation);
    gl.enableVertexAttribArray(velocityAttribLoc);
    // code above this line is initialization code.
    // code below this line is rendering code.

    webGL.resizeCanvasToDisplaySize(gl.canvas);

    // draw
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6,2);
  }, []);

  return (
    <canvas id="WebGL" className="web-canvas" ref={canvas}>Your browser doesn't appear to support the
      <code>&lt;canvas&gt;</code> element.</canvas>);
}