// Storage for data from chunks that were unloaded.
// TODO(kshaunak): Figure out how this serialization works.
//
// The `array` used in level generation below is a rank-3 ndarray.
// See https://github.com/scijs/ndarray
//
// x, y, and z correspond to coordinates 0, 1, and 2 in this tensor.
// y is vertical; gravity accelerates objects in the -y direction.
const crunch = require('voxel-crunch');

export const initWorldGen = (noa, blockIDs) => {

  const chunk_storage = {};
  const chunk_requests = [];

  noa.world.on('chunkBeingRemoved', (id, array, userData) => {
    chunk_storage[id] = crunch.encode(array.data);
  });


  noa.world.on('worldDataNeeded', (id, array, x, y, z, worldName) => {
    chunk_requests.push({id, array, x, y, z});
  });

  setInterval(() => {
    if (chunk_requests.length === 0) return;
    const request = chunk_requests.shift();
    const stored = chunk_storage[request.id];
    if (stored !== undefined) {
      crunch.decode(stored, request.array.data);
    } else {
      generateChunk(request.array, request.x, request.y, request.z);
    }
    noa.world.setChunkData(request.id, request.array);
  }, 10);


  const generateChunk = (array, x, y, z, worldName) => {
    console.log(`generateChunk(${x}, ${y}, ${z})`);
    if (x !== 0 || y !== 0 || z !== 0) return;

    for (let i = 0; i < array.shape[0]; ++i) {
      for (let k = 0; k < array.shape[2]; ++k) {
        const wall = i === 0 || i === array.shape[0] - 1 ||
                     k === 0 || k === array.shape[2] - 1;
        const height = wall ? 4 : 0;
        for (let j = 0; j < array.shape[1]; ++j) {
          const b = decideBlock(x + i, y + j, z + k, height);
          if (b) array.set(i, j, k, b);
        }
      }
    }
  }

  const decideBlock = (x, y, z, height) => {
    const block = 0 <= y && y <= height;
    return block ? blockIDs.grassID : 0;
  }

  const addWorldFeatures = () => {
    let z = 5;
    makeRows(10, 5, z, blockIDs.shinyDirtID);
    makeRows(10, 5, z + 2, blockIDs.dirtID);
    makeRows(10, 5, z + 5, blockIDs.dirtID);
    makeRows(10, 5, z + 9, blockIDs.dirtID);
    makeRows(10, 5, z + 14, blockIDs.dirtID);
  };

  const makeRows = (length, x, z, block) => {
    for (let i = 0; i < length; i++) {
      noa.setBlock(block, x + i, 1, z + i);
      noa.setBlock(block, length * 2 + x - i, 1, z + i);
    }
  }

  setTimeout(addWorldFeatures, 1000);
};

