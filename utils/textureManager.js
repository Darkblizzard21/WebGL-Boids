import {skillsSection} from "../../../portfolio";

let defaultImage = undefined;
let dictionary = {};
const setUpTextures = async (mainRef) => {
  // Set Up Promise
  let defaultLoader = loadImage(mainRef.current.src);
  let skillLoaders = {}
  skillsSection.softwareSkills.map((skills, i) => {
    let name = skills.iconData.tooltip.name;
    let imgSrc = document.getElementById(name + "-forceTexture").src;
    skillLoaders[name] =  loadImage(imgSrc);
  })
  // Await Promise
  defaultImage = await defaultLoader;
  for(let key in skillLoaders) {
    dictionary[key] = await skillLoaders[key];
  }

  // Return default
  return defaultImage;
}

const getTexture = (name) => {
  let image = dictionary[name];
  if(!image){
    image = defaultImage;
  }
  return image;
}

const loadImage = (src) => new Promise(resolve => {
  const image = new Image();
  image.addEventListener("load", () => resolve(image));
  image.src = src;
});


export {
  setUpTextures,
  getTexture
}