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
    for (let i = 0; i < array.shape[0]; ++i) {
      for (let k = 0; k < array.shape[2]; ++k) {
        const height = getHeightMap(x + i, z + k, 10, 30);
        for (let j = 0; j < array.shape[1]; ++j) {
            const b = decideBlock(x + i, y + j, z + k, height)
            if (b) array.set(i, j, k, b)
        }
      }
    }
  }

  const getHeightMap = (x, z, xsize, zsize) => {
    const xs = 0.8 + 2 * Math.sin(x / xsize);
    const zs = 0.4 + 2 * Math.sin(z / zsize + x / 30);
    return xs + zs;
  };

  const decideBlock = (x, y, z, height) => {
    // Flat area to the NE, where we place some hand-crafted features.
    if (x > 0 && z > 0) {
        let h = 1;
        if (z == 63 || x == 63) h = 20;
        return (y < h) ? blockIDs.grassID : 0;
    }
    // General level generation: sine waves filled with water.
    if (y < height) {
      return (y < 0) ? blockIDs.dirtID : blockIDs.grassID;
    } else if (y <= 0) {
      return blockIDs.waterID;
    }
    return 0;
  }

  // After the world is initialzed, fill in a bunch of test blocks. 
  // There's no particular significance to these, I use them to 
  // debug meshing and AO and whatnot

  const addWorldFeatures = () => {
    noa.setBlock(blockIDs.testID1, -6, 5, 6);
    noa.setBlock(blockIDs.testID2, -4, 5, 6);
    noa.setBlock(blockIDs.testID3, -2, 5, 6);

    noa.setBlock(blockIDs.windowID, -5, 3, 6);
    noa.setBlock(blockIDs.windowID, -4, 3, 6);
    noa.setBlock(blockIDs.windowID, -3, 3, 6);

    noa.setBlock(blockIDs.testa, -6, 4, 6);
    noa.setBlock(blockIDs.testb, -5, 4, 6);
    noa.setBlock(blockIDs.testc, -4, 4, 6);

    noa.setBlock(blockIDs.waterPole, -18, -1, 6);
    noa.setBlock(blockIDs.waterPole, -16, -1, 6);
    noa.setBlock(blockIDs.waterPole, -14, -1, 6);

    let z = 5;
    makeRows(10, 5, z, blockIDs.shinyDirtID);
    makeRows(10, 5, z + 2, blockIDs.dirtID);
    makeRows(10, 5, z + 5, blockIDs.dirtID);
    makeRows(10, 5, z + 9, blockIDs.dirtID);
    makeRows(10, 5, z + 14, blockIDs.dirtID);
    z += 18;
    makeRows(10, 5, z, blockIDs.customID);
    makeRows(10, 5, z + 2, blockIDs.customID);
    makeRows(10, 5, z + 5, blockIDs.customID);
    makeRows(10, 5, z + 9, blockIDs.customID);
    makeRows(10, 5, z + 14, blockIDs.customID);
  };

  const makeRows = (length, x, z, block) => {
    for (let i = 0; i < length; i++) {
      noa.setBlock(block, x + i, 1, z + i);
      noa.setBlock(block, length * 2 + x - i, 1, z + i);
    }
  }

  setTimeout(addWorldFeatures, 1000);
};

