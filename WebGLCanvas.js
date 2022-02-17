import React, {useRef, useEffect} from "react";
import WebGLUtil from "./utils/WebGL";
import "./WEbGLCanvas.scss";
import {
  drawParticlesFS,
  drawParticlesVS,
  emptyFS,
  updatePositionVS,
  updateVelocityVS
} from "./shader/shaderVar";


const webGL = new WebGLUtil();

export default function Triangle() {
  const canvas = useRef();

  useEffect(() => {
    console.log("prepare rendering");
    webGL.resizeCanvasToDisplaySize(canvas.current);
    const gl = webGL.getGLContext(canvas.current);

    const updateVelocityProgram = webGL.createProgram(
      gl, [updateVelocityVS, emptyFS], ["newVelocity"]);
    const updatePositionProgram = webGL.createProgram(
      gl, [updatePositionVS, emptyFS], ["newPosition"]);
    const drawParticlesProgram = webGL.createProgram(
      gl, [drawParticlesVS, drawParticlesFS]);

    const updateVelocityPrgLocs = {
      position: gl.getAttribLocation(updateVelocityProgram, "position"),
      oldVelocity: gl.getAttribLocation(updateVelocityProgram, "oldVelocity"),
      maxSpeed: gl.getAttribLocation(updateVelocityProgram, "maxSpeed"),
      minSpeed: gl.getUniformLocation(drawParticlesProgram, "minSpeed"),
      size: gl.getUniformLocation(drawParticlesProgram, "size"),
      deltaTime: gl.getUniformLocation(updateVelocityProgram, "deltaTime"),
      canvasDimensions: gl.getUniformLocation(updateVelocityProgram, "canvasDimensions"),
      allOldPositions: gl.getUniformLocation(updateVelocityProgram, "allOldPositions"),
      allOldVelocities: gl.getUniformLocation(updateVelocityProgram, "allOldVelocities")
    };

    const updatePositionPrgLocs = {
      oldPosition: gl.getAttribLocation(updatePositionProgram, "oldPosition"),
      velocity: gl.getAttribLocation(updatePositionProgram, "velocity"),
      canvasDimensions: gl.getUniformLocation(updatePositionProgram, "canvasDimensions"),
      deltaTime: gl.getUniformLocation(updatePositionProgram, "deltaTime")
    };

    const drawParticlesProgLocs = {
      position: gl.getAttribLocation(drawParticlesProgram, "position"),
      matrix: gl.getUniformLocation(drawParticlesProgram, "matrix"),
      size: gl.getUniformLocation(drawParticlesProgram, "size")
    };


    // create random positions and velocities.
    const rand = (min, max) => {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    };
    const size = 7.0;
    const numParticles = 200;
    const minSpeed = 250;
    const maxSpeed = 300;
    const createPoints = (num, ranges) =>
      new Array(num).fill(0).map(_ => ranges.map(range => rand(...range))).flat();
    const positions = new Float32Array(createPoints(numParticles, [[canvas.current.width], [canvas.current.height]]));
    const velocities = new Float32Array(createPoints(numParticles, [[-maxSpeed,maxSpeed], [-maxSpeed, maxSpeed]], true));
    const maxSpeeds = new Float32Array(Array(numParticles*2).fill(0).map(_ => rand(minSpeed,maxSpeed)));
    // build buffers
    const position1Buffer = webGL.makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
    const position2Buffer = webGL.makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
    const velocity1Buffer = webGL.makeBuffer(gl, velocities, gl.DYNAMIC_DRAW);
    const velocity2Buffer = webGL.makeBuffer(gl, velocities, gl.DYNAMIC_DRAW);
    const speedBuffer = webGL.makeBuffer(gl, maxSpeeds, gl.STATIC_DRAW);

    // build vertex arrays
    const updateVelocityVA1 = webGL.makeVertexArray(gl, [
      [position1Buffer, updateVelocityPrgLocs.position],
      [velocity1Buffer, updateVelocityPrgLocs.oldVelocity],
      [speedBuffer, updateVelocityPrgLocs.maxSpeed]
    ]);
    const updateVelocityVA2 = webGL.makeVertexArray(gl, [
      [position2Buffer, updateVelocityPrgLocs.position],
      [velocity2Buffer, updateVelocityPrgLocs.oldVelocity],
      [speedBuffer, updateVelocityPrgLocs.maxSpeed]
    ]);

    const updatePositionVA1 = webGL.makeVertexArray(gl, [
      [position1Buffer, updatePositionPrgLocs.oldPosition],
      [velocity2Buffer, updatePositionPrgLocs.velocity]
    ]);

    const updatePositionVA2 = webGL.makeVertexArray(gl, [
      [position2Buffer, updatePositionPrgLocs.oldPosition],
      [velocity1Buffer, updatePositionPrgLocs.velocity]
    ]);

    const drawVA1 = webGL.makeVertexArray(
      gl, [[position1Buffer, drawParticlesProgLocs.position],
        [velocity1Buffer, updatePositionPrgLocs.velocity]]);
    const drawVA2 = webGL.makeVertexArray(
      gl, [[position2Buffer, drawParticlesProgLocs.position],
        [velocity2Buffer, updatePositionPrgLocs.velocity]]);

    // build transform feedback
    const velocityFB1 = webGL.makeTransformFeedback(gl, velocity1Buffer);
    const velocityFB2 = webGL.makeTransformFeedback(gl, velocity2Buffer);

    const positionFB1 = webGL.makeTransformFeedback(gl, position1Buffer);
    const positionFB2 = webGL.makeTransformFeedback(gl, position2Buffer);

    // unbind left over stuff
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    // set up collections
    let current = {
      vReadBuffer: velocity1Buffer,
      pReadBuffer: position1Buffer,
      updateVelocityVA: updateVelocityVA1,  // read from velocity1
      updatePositionVA: updatePositionVA1,  // read from position1
      vtf: velocityFB2,                      // write to velocity2
      ptf: positionFB2,                      // write to position2
      drawVA: drawVA2              // draw with position2
    };
    let next = {
      vReadBuffer: velocity2Buffer,
      pReadBuffer: position2Buffer,
      updateVelocityVA: updateVelocityVA2,  // read from velocity2
      updatePositionVA: updatePositionVA2,  // read from position2
      vtf: velocityFB1,                      // write to velocity1
      ptf: positionFB1,                      // write to position1
      drawVA: drawVA1              // draw with position1
    };

    let then = 0;

    function render(time) {
      // convert to seconds
      time *= 0.001;
      // Subtract the previous time from the current time
      const deltaTime = time - then;
      // Remember the current time for the next frame.
      then = time;

      webGL.resizeCanvasToDisplaySize(gl.canvas);

      // compute the new velocities
      gl.useProgram(updateVelocityProgram);
      gl.bindVertexArray(current.updateVelocityVA);
      gl.uniform1f(updateVelocityPrgLocs.minSpeed, minSpeed);
      gl.uniform1f(updateVelocityPrgLocs.size, size);
      gl.uniform1f(updateVelocityPrgLocs.deltaTime, deltaTime);
      gl.uniform2f(updateVelocityPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);

      let positionsView = new Float32Array(numParticles * 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, current.pReadBuffer === position1Buffer ? position1Buffer : position2Buffer);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, positionsView);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.uniform2fv(updateVelocityPrgLocs.allOldPositions, positionsView);
      let velocitiesView = new Float32Array(numParticles * 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, current.vReadBuffer === velocity1Buffer ? velocity1Buffer : velocity2Buffer);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, velocitiesView);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.uniform2fv(updateVelocityPrgLocs.allOldVelocities, velocitiesView);

      gl.enable(gl.RASTERIZER_DISCARD);

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.vtf);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, numParticles);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      // compute the new positions

      gl.useProgram(updatePositionProgram);
      gl.bindVertexArray(current.updatePositionVA);
      gl.uniform2f(updatePositionPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.ptf);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, numParticles);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      // turn on using fragment shaders again
      gl.disable(gl.RASTERIZER_DISCARD);

      // now draw the particles.
      gl.useProgram(drawParticlesProgram);
      gl.bindVertexArray(current.drawVA);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.uniformMatrix4fv(
        drawParticlesProgLocs.matrix,
        false,
        webGL.m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1));
      gl.uniform1f(drawParticlesProgLocs.size, size);
      gl.drawArrays(gl.POINTS, 0, numParticles);

      // swap which buffer we will read from
      // and which one we will write to
      {
        const temp = current;
        current = next;
        next = temp;
      }
      requestAnimationFrame(render);
    }

    console.log("start rendering");
    requestAnimationFrame(render);
  }, []);

  return (
    <canvas id="WebGL" className="web-canvas" ref={canvas}>Your browser doesn't appear to support the
      <code>&lt;canvas&gt;</code> element.</canvas>);
}
