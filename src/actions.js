

import { shootBouncyBall } from './entities'


/*
 *
 *      interactivity
 *
*/


/** @param {import("noa-engine").Engine} noa */
export function setupInteractions(noa, blockIDs) {

    // on left mouse, set targeted block to be air
    noa.inputs.down.on('fire', function () {
      const block = noa.targetedBlock;
      if (!block || block.blockID === blockIDs.grassID) return;
      const pos = Array.from(noa.targetedBlock.position);
      noa.setBlock(0, pos[0], pos[1], pos[2]);
      setTimeout(() => flowWater(noa, blockIDs, [pos]), kWaterDelay);
    });


    // place block on alt-fire (RMB/E)
    var pickedID = 1
    noa.inputs.down.on('alt-fire', function () {
        if (noa.targetedBlock) {
            var pos = noa.targetedBlock.adjacent
            noa.addBlock(pickedID, pos[0], pos[1], pos[2])
        }
    })


    // pick block on middle fire (MMB/Q)
    noa.inputs.down.on('mid-fire', function () {
        if (noa.targetedBlock) pickedID = noa.targetedBlock.blockID
    })


    // pause (P)
    noa.inputs.bind('pause', 'P')
    noa.inputs.down.on('pause', function () {
        paused = !paused
        noa.setPaused(paused)
    })
    var paused = false



    // invert mouse (I)
    noa.inputs.bind('invert-mouse', 'I')
    noa.inputs.down.on('invert-mouse', function () {
        noa.camera.inverseY = !noa.camera.inverseY
    })



    // shoot a bouncy ball (1)
    noa.inputs.bind('shoot', '1')
    var shoot = () => shootBouncyBall(noa)
    var interval, timeout
    noa.inputs.down.on('shoot', function () {
        shoot()
        timeout = setTimeout(() => {
            interval = setInterval(shoot, 50)
        }, 400)
    })
    noa.inputs.up.on('shoot', function () {
        clearTimeout(timeout)
        clearInterval(interval)
    })



    // testing timeScale
    var speed = 0
    noa.inputs.bind('slow', '3')
    noa.inputs.down.on('slow', () => {
        noa.timeScale = [1, 0.1, 2][(++speed) % 3]
    })



    // each tick, consume any scroll events and use them to zoom camera
    noa.on('tick', function (dt) {
        var scroll = noa.inputs.state.scrolly
        if (scroll !== 0) {
            noa.camera.zoomDistance += (scroll > 0) ? 1 : -1
            if (noa.camera.zoomDistance < 0) noa.camera.zoomDistance = 0
            if (noa.camera.zoomDistance > 10) noa.camera.zoomDistance = 10
        }
    })



}

const kWaterDelay = 200;
const kWaterDisplacements = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, 0, -1],
];

const hasWaterNeighbor = (noa, blockIDs, p) => {
  for (const d of kWaterDisplacements) {
    const block = noa.getBlock(d[0] + p[0], d[1] + p[1], d[2] + p[2]);
    if (block === blockIDs.waterID) return true;
  }
  return false;
};

const flowWater = (noa, blockIDs, points) => {
  const visited = {};
  const next = [];

  for (const p of points) {
    const block = noa.getBlock(p[0], p[1], p[2]);
    if (block !== 0 || !hasWaterNeighbor(noa, blockIDs, p)) continue;
    noa.setBlock(blockIDs.waterID, p[0], p[1], p[2]);
    for (const d of kWaterDisplacements) {
      const n = [p[0] - d[0], p[1] - d[1], p[2] - d[2]];
      const key = `${n[0]}-${n[1]}-${n[2]}`;
      if (visited[key]) continue;
      visited[key] = true;
      next.push(n);
    }
  }

  if (next.length === 0) return;
  setTimeout(() => flowWater(noa, blockIDs, next), kWaterDelay);
};
