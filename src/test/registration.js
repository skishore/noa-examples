
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Vector3, Matrix } from '@babylonjs/core/Maths/math'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import '@babylonjs/core/Meshes/Builders/boxBuilder'




/*
 *
 *		Register a bunch of blocks and materials and whatnot
 *
*/

export function initRegistration(noa) {

    // block materials
    var brownish = [0.45, 0.36, 0.22]
    var greenish = [0.1, 0.8, 0.2]
    var greenish2 = [0.1, 0.6, 0.2]
    noa.registry.registerMaterial('grass', greenish, null)
    noa.registry.registerMaterial('grass2', greenish2, null)
    noa.registry.registerMaterial('dirt', brownish, null, false)
    var strs = ['a', 'b', 'c', 'd', '1', '2']
    for (var i = 0; i < 6; i++) {
        var s = strs[i]
        noa.registry.registerMaterial(s, null, s + '.png')
        noa.registry.registerMaterial('t' + s, null, 't' + s + '.png', true)
    }
    noa.registry.registerMaterial('water', [0.5, 0.5, 0.8, 0.7], null)
    noa.registry.registerMaterial('water2', [0.5, 0.5, 0.8, 0.7], null)



    // do some Babylon.js stuff with the scene, materials, etc.
    var scene = noa.rendering.getScene()

    // register a block material with a transparent texture
    // noa.registry.registerMaterial('window', brownish, 'window.png', true)

    var tmat = noa.rendering.makeStandardMaterial('')
    tmat.diffuseTexture = new Texture('textures/window.png', scene)
    tmat.opacityTexture = tmat.diffuseTexture
    noa.registry.registerMaterial('window', null, null, false, tmat)

    // register a shinyDirt block with a custom render material
    var shinyMat = noa.rendering.makeStandardMaterial('shinyDirtMat')
    shinyMat.specularColor.copyFromFloats(1, 1, 1)
    shinyMat.specularPower = 32
    shinyMat.bumpTexture = new Texture('textures/stone.png', scene)
    noa.registry.registerMaterial('shinyDirt', brownish, null, false, shinyMat)


    // object block mesh
    var mesh = Mesh.CreateBox('post', 1, scene)
    var mat = Matrix.Scaling(0.2, 1, 0.2)
    mat.setTranslation(new Vector3(0, 0.5, 0))
    mesh.bakeTransformIntoVertices(mat)
    scene.removeMesh(mesh)


    // block types registration
    var blockIDs = {}
    var _id = 1

    blockIDs.dirtID = noa.registry.registerBlock(_id++, { material: 'dirt' })
    blockIDs.shinyDirtID = noa.registry.registerBlock(_id++, { material: 'shinyDirt' })
    blockIDs.grassID = noa.registry.registerBlock(_id++, { material: 'grass' })
    blockIDs.grass2ID = noa.registry.registerBlock(_id++, { material: 'grass2' })
    blockIDs.testID1 = noa.registry.registerBlock(_id++, { material: ['b', 'd', '1', '2', 'c', 'a'] })
    blockIDs.windowID = noa.registry.registerBlock(_id++, {
        material: 'window',
        opaque: false,
    })
    blockIDs.testID2 = noa.registry.registerBlock(_id++, {
        material: ['tb', 'td', 't1', 't2', 'tc', 'ta'],
        opaque: false,
    })
    blockIDs.testID3 = noa.registry.registerBlock(_id++, { material: ['1', '2', 'a'] })
    blockIDs.waterID = noa.registry.registerBlock(_id++, {
      material: 'water',
      fluid: true,
    });
    blockIDs.customID = noa.registry.registerBlock(_id++, {
        blockMesh: mesh,
        opaque: false,
        onCustomMeshCreate: function (mesh, x, y, z) {
            mesh.rotation.y = ((x + 0.234) * 1.234 + (z + 0.567) * 6.78) % (2 * Math.PI)
        },
    })

    blockIDs.waterPole = noa.registry.registerBlock(_id++, {
        blockMesh: mesh,
        solid: true,
        opaque: false,
        material: 'water',
        fluid: true,
    })



    var make = (s) => {
        var testMat = noa.rendering.makeStandardMaterial('')
        testMat.backFaceCulling = false
        testMat.diffuseTexture = new Texture('textures/' + s + '.png')
        testMat.diffuseTexture.hasAlpha = true
        window.t = testMat

        var testMesh = Mesh.CreatePlane('cross:' + s, 1, scene)
        testMesh.material = testMat
        testMesh.rotation.x += Math.PI
        testMesh.rotation.y += Math.PI / 4
        let offset = Matrix.Translation(0, -0.5, 0)
        testMesh.bakeTransformIntoVertices(offset)
        let clone = testMesh.clone()
        clone.rotation.y += Math.PI / 2
        var result = Mesh.MergeMeshes([testMesh, clone], true)
        return result
    }

    blockIDs.testa = noa.registry.registerBlock(_id++, {
        blockMesh: make('ta'),
        opaque: false,
    })

    blockIDs.testb = noa.registry.registerBlock(_id++, {
        blockMesh: make('tb'),
        opaque: false,
    })

    blockIDs.testc = noa.registry.registerBlock(_id++, {
        blockMesh: make('tc'),
        opaque: false,
    })

    hijackComponentDefinitions(noa, blockIDs);

    return blockIDs
}

import vec3 from 'gl-vec3';

let noa = null;
let blockIDs = null;
let errorCaught = false;

const hijackComponentDefinitions = (a, b) => {
  noa = a;
  blockIDs = b;
  noa.ents.components.movement.system = catchErrors(movementSystem);
};

const catchErrors = (system) => (dt, states) => {
  if (errorCaught) return;
  try {
    system(dt, states);
  } catch (e) {
    errorCaught = true;
    console.error(e);
  }
};

const movementState = {
  heading: 0,
  running: false,
  jumping: false,

  // options
  maxSpeed: 10,
  moveForce: 30,
  responsiveness: 15,
  runningFriction: 0,
  standingFriction: 2,

  // jumps
  airMoveMult: 0.5,
  jumpImpulse: 10,
  jumpForce: 12,
  jumpTime: 500,
  airJumps: 1,

  // internal state
  _jumpCount: 0,
  _currjumptime: 0,
  _isJumping: false,
};

const movementSystem = (dt, states) => {
  const ents = noa.ents;
  for (const state of states) {
    const physics = ents.getPhysics(state.__id);
    if (physics) applyMovementPhysics(dt, state, physics.body);
  }
};

const move = vec3.create();
const push = vec3.create();
const zero = vec3.create();

const applyMovementPhysics = (dt, state, body) => {
  body.gravityMultiplier = body.inFluid ? 2 : 4;

  const grounded = body.atRestY() < 0;
  if (grounded) {
    state._isJumping = false;
    state._jumpCount = 0;
  }

  if (state.jumping) {
    handleJumping(dt, state, body, grounded);
  } else {
    state._isJumping = false;
  }

  if (state.running) {
    handleRunning(dt, state, body, grounded);
    body.friction = state.runningFriction;
  } else {
    body.friction = state.standingFriction;
  }
};

const handleJumping = (dt, state, body, grounded) => {
  if (state._isJumping) {
    if (state._currjumptime <= 0) return;
    const delta = state._currjumptime < dt ? state._currjumptime / dt : 1;
    const force = state.jumpForce * delta;
    body.applyForce([0, force, 0]);
    return;
  }

  const hasAirJumps = state._jumpCount < state.airJumps;
  const canJump = grounded || body.inFluid || hasAirJumps;
  if (!canJump) return;

  state._isJumping = true;
  state._currjumptime = state.jumpTime;
  body.applyImpulse([0, state.jumpImpulse, 0]);
  if (grounded) return;

  body.velocity[1] = Math.max(body.velocity[1], 0);
  state._jumpCount++;
};

const handleRunning = (dt, state, body, grounded) => {
  const speed = state.maxSpeed;
  vec3.set(move, 0, 0, speed);
  vec3.rotateY(move, move, zero, state.heading);

  vec3.subtract(push, move, body.velocity);
  push[1] = 0;
  const length = vec3.length(push);
  if (length === 0) return;

  const bound = state.moveForce * (grounded ? 1 : state.airMoveMult);
  const input = state.responsiveness * length;
  const force = Math.min(bound, input);
  vec3.normalize(push, push);
  vec3.scale(push, push, force);
  body.applyForce(push);
};
