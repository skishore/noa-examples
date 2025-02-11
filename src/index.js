

/*
 *
 *
 *      Testbed.
 *
 *
 */


// Engine options object, and engine instantiation:
import { Engine } from 'noa-engine'

// or import from local filesystem when hacking locally:
// import { Engine } from '../../../noa'


import { initRegistration } from './registration'
import { initWorldGen } from './worldgen'
import { setupPlayerEntity } from './entities'
import { setupInteractions } from './actions'


const chunkSize = 32;
const start = chunkSize / 2;

// create engine
var noa = new Engine({
    debug: true,
    showFPS: true,
    inverseY: false,
    inverseX: false,
    chunkSize,
    chunkAddDistance: [0, 0],
    blockTestDistance: 50,
    texturePath: 'textures/',
    playerStart: [start, 5, start],
    playerHeight: 1.2,
    playerWidth: 0.6,
    playerAutoStep: true,
    useAO: true,
    AOmultipliers: [0.92, 0.8, 0.5],
    reverseAOmultiplier: 1.0,
    manuallyControlChunkLoading: false,
    originRebaseDistance: 25,
    fluidDensity: 2.0,
    fluidDrag: 4.0,
})


// this registers all the blocks and materials
var blockIDs = initRegistration(noa)

// this sets up worldgen
initWorldGen(noa, blockIDs)

// adds a mesh to player
setupPlayerEntity(noa)

// does stuff on button presses
setupInteractions(noa, blockIDs)

