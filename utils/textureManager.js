import {skillsSection} from "../../../portfolio";

let dictionary = {};
const setUpTextures = async mainRef => {
  // Set Up Promise
  let skillLoaders = {};
  skillsSection.softwareSkills.map((skills, i) => {
    let name = skills.iconData.tooltip.name;
    let imgSrc = document.getElementById(name + "-forceTexture").src;
    skillLoaders[name] = loadImage(imgSrc);

    return null
  });
  // Await Promise
  for (let key in skillLoaders) {
    dictionary[key] = await skillLoaders[key];
  }

  // Return default
};

const getTexture = name => {
  let image = dictionary[name];
  if (!image) {
    console.warn('image with name "' + name + '" was not found');
  }
  return image;
};

const loadImage = src =>
  new Promise(resolve => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.src = src;
  });

export {setUpTextures, getTexture};
