import React, {useEffect, useRef} from "react";
import WebGLUtil from "./utils/WebGL";
import "./WEbGLCanvas.scss";

const drawParticlesInstancedVS = `#version 300 es
precision mediump float;


in vec2 i_velocity;
in vec2 i_offset;
in vec2 a_position;
in vec2 a_texCoord;

uniform mat4 matrix;
uniform float scale;

out vec2 v_texCoord;

float angleBetween(vec2 first, vec2 second){
    float dividend = dot(first,second);
    float divisor = length(first)*length(second);
    float rotation = acos(dividend/divisor);
    if(first.x > 0.0)
      rotation = -rotation;
    return rotation;
}
  
vec2 rotate(vec2 origin, float rad){
    float x = cos(rad)*origin.x - sin(rad) * origin.y;
    float y = sin(rad)*origin.x + cos(rad) * origin.y;
    return vec2(x, y);
}

void main () {
    float rotation = angleBetween(i_velocity,vec2(0,1));
    vec2 scaledPosition = a_position * scale;
    gl_Position = matrix * vec4(i_offset + (rotate(scaledPosition,rotation)),0,1); // x,y,z,w
    v_texCoord = a_texCoord;
}
  `;

const drawParticlesInstancedFS = `#version 300 es
precision mediump float;

in vec2 v_texCoord;

uniform sampler2D uSampler;

out vec4 color;

void main () {
    color = texture(uSampler, v_texCoord);
}`;


const webGL = new WebGLUtil();

let WebGLDebugUtil = require("webgl-debug");


const loadImage = (src) => new Promise(resolve => {
  const image = new Image();
  image.addEventListener('load', () => resolve(image));
  image.src = src;
});

export default function Test() {
  const canvas = useRef();
  const imgRef = useRef();

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
    var program = webGL.createProgram(gl, [drawParticlesInstancedVS, drawParticlesInstancedFS]);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_texCoord");
    var offsetAttributeLocation = gl.getAttribLocation(program, "i_offset");
    var velocityAttribLoc = gl.getAttribLocation(program, "i_velocity");
    var scaleUniformLoc = gl.getUniformLocation(program, "scale");
    var viewUniformLoc = gl.getUniformLocation(program, "matrix");

    const pixels = new Uint8Array([
      255,255,255,		230,25,75,			60,180,75,			255,225,25,
      67,99,216,			245,130,49,			145,30,180,			70,240,240,
      240,50,230,			188,246,12,			250,190,190,		0,128,128,
      230,190,255,		154,99,36,			255,250,200,		0,0,0,
    ]);
    // Create a buffer and put three 2d clip space points in it
    var attributeBuffer = gl.createBuffer();

    let modelData = new Float32Array([
      -.9,.9,0,1,
      -.9,-.9,0,0,
      .9,.9,1,1,
      .9,.9,1,1,
      -.9,-.9,0,0,
      .9,-.9,1,0,
    ])

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 16, 8);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(uvAttributeLocation);

    var instanceBuffer = gl.createBuffer();
    let instanceData = new Float32Array([
      200, 200, 0, 1,
      500, 300, 0.9, 0.1,
      500, 100, 0.9, -0.1
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

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniformMatrix4fv(
      viewUniformLoc,
      false,
      webGL.m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1));
    gl.uniform1f(scaleUniformLoc, 100);

    const x = async () => {
      const image = await loadImage(imgRef.current.src);

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      const textureSlot = 1;
      gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), textureSlot);
      gl.activeTexture(gl.TEXTURE0 + textureSlot);

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256,256, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);

      // draw
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6,3);
    }
    x();
  }, []);

  return (
    <div><img className="hidden" src={require("./forceFieldTextureCreator/mediaOut/qOutput1.png")} ref={imgRef}></img>
    <canvas id="WebGL" className="web-canvas" ref={canvas}>Your browser doesn't appear to support the
      <code>&lt;canvas&gt;</code> element.</canvas></div>);
}