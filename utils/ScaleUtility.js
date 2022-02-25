const mobileScreenWidth = 750;
const mobileScale = 2.0;
const normalScale = 1.0;
let canvasScale = normalScale;

const getCanvasScale = () => canvasScale;

const refreshCanvasScale = () => {
  canvasScale = document.innerWidth <= mobileScreenWidth ? mobileScale : normalScale;
}

export {
  getCanvasScale,
  refreshCanvasScale
};