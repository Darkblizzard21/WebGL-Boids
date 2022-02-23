import React, {useRef, useEffect} from "react";
import WebGLUtil from "./utils/WebGL";
import "./WEbGLCanvas.scss";
import {ID_Draw, ID_ProgramAndLocs, ID_VA} from "./utils/instanceDraw";
import {UV_ProgramAndLocs, UV_VA_FB, UV_Update} from "./utils/updateVelocity";
import {rand} from "./utils/utility";
import {UP_ProgramAndLocs, UP_Update, UP_VA_FB} from "./utils/updatePosition";
import {
  activateTexture, deactivateTexture,
  UFVT_BindTexture,
  UVFT_ProgramAndLocs,
  UVFT_Update,
  UVFT_VA_FB
} from "./utils/updateVelocityForceTexture";
import {setUpTextures} from "./utils/textureManager";

const webGL = new WebGLUtil();

export default function Boids(texture) {
  const canvas = useRef();
  const useTexture = texture && Object.keys(texture).length !== 0;
  useEffect(() => {
    console.log("prepare rendering");
    webGL.resizeCanvasToDisplaySize(canvas.current);
    const gl = webGL.getGLContext(canvas.current);

    // Load Programs and locations
    const updateVelocityPL = useTexture ?
      UVFT_ProgramAndLocs(gl, webGL) :
      UV_ProgramAndLocs(gl, webGL);
    const updateVelocityProgram = updateVelocityPL.program;
    const updateVelocityPrgLocs = updateVelocityPL.locations;

    const updatePositionPL = UP_ProgramAndLocs(gl, webGL);
    const updatePositionProgram = updatePositionPL.program;
    const updatePositionPrgLocs = updatePositionPL.locations;

    const drawPL = ID_ProgramAndLocs(gl, webGL);
    const drawInstancedProgram = drawPL.program;
    const drawInstancedProgLocs = drawPL.locations;

    // create random positions and velocities.
    const size = 7.0;
    const margin = size * 2.0;
    const numParticles = 200;
    const minSpeed = 50;
    const minMaxSpeed = useTexture ? 100 : 200;
    const maxSpeed = useTexture ? 250 : 350;
    const spawnMargin = 0.2;
    const createPoints = (num, ranges) =>
      new Array(num).fill(0).map(_ => ranges.map(range => rand(...range))).flat();
    const positions = new Float32Array(createPoints(numParticles,
      [[canvas.current.width * spawnMargin, canvas.current.width * (1 - spawnMargin)],
        [canvas.current.height * spawnMargin, canvas.current.height * (1 - spawnMargin)]]));
    const velocities = new Float32Array(createPoints(numParticles, useTexture ? [[0, 0.001], [0.999, 1.0]] : [[-maxSpeed, maxSpeed], [-maxSpeed, maxSpeed]], true));
    const maxSpeeds = new Float32Array(Array(numParticles * 2).fill(0).map(_ => rand(minMaxSpeed, maxSpeed)));


    // build buffers
    const position1Buffer = webGL.makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
    const position2Buffer = webGL.makeBuffer(gl, positions, gl.DYNAMIC_DRAW);
    const velocity1Buffer = webGL.makeBuffer(gl, velocities, gl.DYNAMIC_DRAW);
    const velocity2Buffer = webGL.makeBuffer(gl, velocities, gl.DYNAMIC_DRAW);
    const speedBuffer = webGL.makeBuffer(gl, maxSpeeds, gl.STATIC_DRAW);

    // build updateVelocity vertex arrays
    const uvvafb = useTexture ?
      UVFT_VA_FB(gl, webGL,
        position1Buffer, position2Buffer,
        velocity1Buffer, velocity2Buffer,
        speedBuffer, updateVelocityPrgLocs) :
      UV_VA_FB(gl, webGL,
        position1Buffer, position2Buffer,
        velocity1Buffer, velocity2Buffer,
        speedBuffer, updateVelocityPrgLocs);

    const updateVelocityVA1 = uvvafb.va1;
    const updateVelocityVA2 = uvvafb.va2;
    const velocityFB1 = uvvafb.fb1;
    const velocityFB2 = uvvafb.fb2;

    // build updatePosition vertex arrays
    const upvafb = UP_VA_FB(gl, webGL,
      position1Buffer, position2Buffer,
      velocity1Buffer, velocity2Buffer,
      updatePositionPrgLocs);

    const updatePositionVA1 = upvafb.va1;
    const updatePositionVA2 = upvafb.va2;
    const positionFB1 = upvafb.fb1;
    const positionFB2 = upvafb.fb2;

    // unbind left over stuff
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    // build instancedVa

    const instancedVA = ID_VA(gl, webGL,
      position1Buffer, position2Buffer,
      velocity1Buffer, velocity2Buffer,
      drawInstancedProgLocs,
      numParticles,
      useTexture ? [.26, .66, .49] : [.26, .66, .49, 0.5, 1, 1]);

    // set up collections
    let current = {
      vReadBuffer: velocity1Buffer,
      pReadBuffer: position1Buffer,
      updateVelocityVA: updateVelocityVA1,  // read from velocity1
      updatePositionVA: updatePositionVA1,  // read from position1
      vtf: velocityFB2,                      // write to velocity2
      ptf: positionFB2,                      // write to position2
      instancedDrawVA: instancedVA.va2
    };
    let next = {
      vReadBuffer: velocity2Buffer,
      pReadBuffer: position2Buffer,
      updateVelocityVA: updateVelocityVA2,  // read from velocity2
      updatePositionVA: updatePositionVA2,  // read from position2
      vtf: velocityFB1,                      // write to velocity1
      ptf: positionFB1,                     // write to position1
      instancedDrawVA: instancedVA.va1
    };

    let then = 0;

    function render(time) {
      // convert to seconds
      time *= 0.001;
      // Subtract the previous time from the current time
      const deltaTime = Math.min(time - then, 0.1);
      // Remember the current time for the next frame.
      then = time;

      webGL.resizeCanvasToDisplaySize(gl.canvas);

      // compute the new velocities
      useTexture ?
        UVFT_Update(gl,
          updateVelocityProgram, updateVelocityPrgLocs,
          minSpeed, deltaTime, numParticles, size, current) :
        UV_Update(gl,
          updateVelocityProgram, updateVelocityPrgLocs,
          minSpeed, deltaTime, numParticles, size, current);

      // compute the new positions

      UP_Update(gl,
        updatePositionProgram, updatePositionPrgLocs,
        deltaTime, margin, numParticles, current);

      // now draw the particles.

      ID_Draw(gl, webGL,
        drawInstancedProgram, drawInstancedProgLocs,
        numParticles, size,
        current.instancedDrawVA);

      // swap which buffer we will read from
      // and which one we will write to
      {
        const temp = current;
        current = next;
        next = temp;
      }

      let waitTime = 1000 / 30 - deltaTime*1000;
      if(1.0 < waitTime){
        setTimeout(() => {
          requestAnimationFrame(render);
        }, waitTime);
      }
      else{
        requestAnimationFrame(render);
      }
    }

    if (useTexture) {
      const startAfterLoad = async () => {
        await setUpTextures();
        requestAnimationFrame(render);
      };
      startAfterLoad();
    } else {
      console.log("start rendering");
      requestAnimationFrame(render);
    }
  }, []);

  return (
      <canvas id="WebGL"
              className="web-canvas"
              ref={canvas}
              >Your browser doesn't appear to support the
        <code>&lt;canvas&gt;</code> element.
      </canvas>
    );
}
