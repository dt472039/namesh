// Game Variables
let scene, camera, renderer;
let playerCar;
let aiBots = [];
let speedBreakers = [];
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false };
let isGameOver = false;
let gameStarted = false;
let score = 0;
let speed = 0;
let maxSpeed = 1.2;
let acceleration = 0.005;
let deceleration = 0.01;
let friction = 0.005;
let turnSpeed = 0.03;
let cameraOffset = new THREE.Vector3(0, 8, -15);
let bumpTimer = 0;

// UI Elements
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Map Constants
const MAP_SIZE = 1000;
const ROAD_WIDTH = 20;
const BLOCK_SIZE = 100; // Distance between roads

// Initialize Three.js
function init3D() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 300);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Build Environment
    buildMap();
    buildCityBlocks(); // Trees, grass and houses in every city block

    // Build Player Car
    playerCar = createCar(0x00f3ff, true);
    playerCar.position.set(ROAD_WIDTH / 4, 0, 0); // Start on the right lane of the center road
    scene.add(playerCar);

    // Add some speed breakers
    createSpeedBreakers();

    // Populate AI Bots
    populateAIBots();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
    document.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);

    // Start Animation Loop
    animate();
}

function buildMap() {
    // Ground (Greenery/City Blocks)
    const groundGeometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.1;
    scene.add(ground);

    // Roads Grid
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = -MAP_SIZE / 2; i <= MAP_SIZE / 2; i += BLOCK_SIZE) {
        // Horizontal Roads
        const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE, ROAD_WIDTH), roadMaterial);
        hRoad.rotation.x = -Math.PI / 2;
        hRoad.position.set(0, 0, i);
        hRoad.receiveShadow = true;
        scene.add(hRoad);

        // Horizontal dashed lines
        for (let x = -MAP_SIZE / 2; x < MAP_SIZE / 2; x += 20) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.5), lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.05, i);
            scene.add(line);
        }

        // Vertical Roads
        const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, MAP_SIZE), roadMaterial);
        vRoad.rotation.x = -Math.PI / 2;
        vRoad.position.set(i, 0, 0);
        vRoad.receiveShadow = true;
        scene.add(vRoad);

        // Vertical dashed lines
        for (let z = -MAP_SIZE / 2; z < MAP_SIZE / 2; z += 20) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 10), lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(i, 0.05, z);
            scene.add(line);
        }
    }
}

// ─── TREE ────────────────────────────────────────────────────────────────────
function createTree(x, z) {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Layered foliage
    const foliageMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const foliageMat2 = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });

    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 4, 8), foliageMat);
    cone1.position.y = 5;
    cone1.castShadow = true;
    group.add(cone1);

    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.5, 8), foliageMat2);
    cone2.position.y = 7.5;
    cone2.castShadow = true;
    group.add(cone2);

    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3, 8), foliageMat);
    cone3.position.y = 9.5;
    cone3.castShadow = true;
    group.add(cone3);

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    group.scale.setScalar(0.7 + Math.random() * 0.5);
    return group;
}

// ─── HOUSE ───────────────────────────────────────────────────────────────────
function createHouse(x, z) {
    const group = new THREE.Group();

    const houseColors = [0xffe0b2, 0xf5f5f5, 0xffccbc, 0xe8d5b7, 0xd7ccc8, 0xb2dfdb];
    const roofColors  = [0xc62828, 0x4527a0, 0x1565c0, 0x2e7d32, 0x6d4c41, 0xad1457];
    const wallColor   = houseColors[Math.floor(Math.random() * houseColors.length)];
    const roofColor   = roofColors[Math.floor(Math.random() * roofColors.length)];

    const wallMat = new THREE.MeshLambertMaterial({ color: wallColor });
    const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
    const doorMat  = new THREE.MeshLambertMaterial({ color: 0x795548 });

    const width  = 10 + Math.random() * 8;
    const depth  = 10 + Math.random() * 8;
    const height =  8 + Math.random() * 6;

    // Main building body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeo, wallMat);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Pitched roof
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.78, height * 0.55, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + height * 0.28;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Front door
    const doorGeo = new THREE.BoxGeometry(2, 3.5, 0.2);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.75, depth / 2 + 0.1);
    group.add(door);

    // Windows
    const winGeo = new THREE.BoxGeometry(2, 2, 0.2);
    [-3, 3].forEach(wx => {
        const win = new THREE.Mesh(winGeo, windowMat);
        win.position.set(wx, height * 0.55, depth / 2 + 0.1);
        group.add(win);
    });

    // Side windows
    const swinGeo = new THREE.BoxGeometry(0.2, 2, 2);
    [-1, 1].forEach(side => {
        const swin = new THREE.Mesh(swinGeo, windowMat);
        swin.position.set(side * (width / 2 + 0.1), height * 0.55, 0);
        group.add(swin);
    });

    group.position.set(x, 0, z);
    group.rotation.y = (Math.floor(Math.random() * 4)) * (Math.PI / 2);
    return group;
}

// ─── GRASS PATCH ─────────────────────────────────────────────────────────────
function createGrassPatch(x, z) {
    const geo = new THREE.CircleGeometry(3 + Math.random() * 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x66BB6A });
    const patch = new THREE.Mesh(geo, mat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.02, z);
    patch.receiveShadow = true;
    return patch;
}

// ─── POPULATE CITY BLOCKS ────────────────────────────────────────────────────
function buildCityBlocks() {
    const half = MAP_SIZE / 2;
    const margin = ROAD_WIDTH / 2 + 5; // Keep away from road edges

    for (let bx = -half; bx < half; bx += BLOCK_SIZE) {
        for (let bz = -half; bz < half; bz += BLOCK_SIZE) {
            // Block centre in world space (skip road intersections)
            const cx = bx + BLOCK_SIZE / 2;
            const cz = bz + BLOCK_SIZE / 2;

            // Inner area available for props
            const innerSize = BLOCK_SIZE - ROAD_WIDTH - 4;

            // ── Grass patches (sprinkle across whole block) ──
            const numGrass = 4 + Math.floor(Math.random() * 5);
            for (let g = 0; g < numGrass; g++) {
                const gx = cx + (Math.random() - 0.5) * innerSize;
                const gz = cz + (Math.random() - 0.5) * innerSize;
                scene.add(createGrassPatch(gx, gz));
            }

            // ── Houses (1–3 per block) ──
            const numHouses = 1 + Math.floor(Math.random() * 3);
            for (let h = 0; h < numHouses; h++) {
                const hx = cx + (Math.random() - 0.5) * (innerSize * 0.7);
                const hz = cz + (Math.random() - 0.5) * (innerSize * 0.7);
                scene.add(createHouse(hx, hz));
            }

            // ── Trees (3–7 per block, placed near edges / corners) ──
            const numTrees = 3 + Math.floor(Math.random() * 5);
            for (let t = 0; t < numTrees; t++) {
                const tx = cx + (Math.random() - 0.5) * innerSize;
                const tz = cz + (Math.random() - 0.5) * innerSize;
                scene.add(createTree(tx, tz));
            }
        }
    }
}

// Improved 3D Car Model
function createCar(colorHex, isPlayer) {
    const carGroup = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshLambertMaterial({ color: colorHex });
    const windowMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(3, 1, 6);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 1;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(2.5, 1, 3);
    const cabin = new THREE.Mesh(cabinGeo, windowMat);
    cabin.position.set(0, 2, -0.5);
    cabin.castShadow = true;
    carGroup.add(cabin);
    
    // Roof
    const roofGeo = new THREE.BoxGeometry(2.5, 0.1, 3);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 2.55, -0.5);
    carGroup.add(roof);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    
    const wPositions = [
        [1.6, 0.6, 2], [-1.6, 0.6, 2],
        [1.6, 0.6, -2], [-1.6, 0.6, -2]
    ];

    wPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(...pos);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.6, 0.4, 0.1);
    const hl1 = new THREE.Mesh(hlGeo, lightMat);
    hl1.position.set(1, 1.2, 3.01);
    const hl2 = new THREE.Mesh(hlGeo, lightMat);
    hl2.position.set(-1, 1.2, 3.01);
    carGroup.add(hl1, hl2);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.8, 0.3, 0.1);
    const tl1 = new THREE.Mesh(tlGeo, tailMat);
    tl1.position.set(1, 1.2, -3.01);
    const tl2 = new THREE.Mesh(tlGeo, tailMat);
    tl2.position.set(-1, 1.2, -3.01);
    carGroup.add(tl1, tl2);

    if (isPlayer) {
        // Add point light for player car headlights
        const spotLight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI/4, 0.5, 1);
        spotLight.position.set(0, 2, 3);
        spotLight.target.position.set(0, 0, 20);
        carGroup.add(spotLight);
        carGroup.add(spotLight.target);
    }

    return carGroup;
}

function createSpeedBreakers() {
    const sbMat = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Yellow
    const sbMatBlack = new THREE.MeshLambertMaterial({ color: 0x111111 }); // Black
    
    for (let i = 0; i < 20; i++) {
        // Randomly place on a horizontal or vertical road
        const isHorizontal = Math.random() > 0.5;
        const roadIndex = (Math.floor(Math.random() * (MAP_SIZE / BLOCK_SIZE)) - (MAP_SIZE / BLOCK_SIZE) / 2) * BLOCK_SIZE;
        const randomPos = (Math.random() - 0.5) * MAP_SIZE;

        const sbGroup = new THREE.Group();
        
        // Striped pattern
        for(let j=0; j<ROAD_WIDTH; j+=2) {
            const geo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
            geo.rotateZ(Math.PI / 2);
            const mesh = new THREE.Mesh(geo, j % 4 === 0 ? sbMat : sbMatBlack);
            mesh.position.set(j - ROAD_WIDTH/2 + 1, 0.1, 0);
            sbGroup.add(mesh);
        }

        if (isHorizontal) {
            sbGroup.position.set(randomPos, 0, roadIndex);
        } else {
            sbGroup.position.set(roadIndex, 0, randomPos);
            sbGroup.rotation.y = Math.PI / 2;
        }

        scene.add(sbGroup);
        speedBreakers.push({
            mesh: sbGroup,
            x: sbGroup.position.x,
            z: sbGroup.position.z,
            isHorizontal: isHorizontal
        });
    }
}

class AIBot {
    constructor() {
        const colors = [0xff0000, 0x00ff00, 0xffaa00, 0xff00ff, 0x4444ff];
        this.mesh = createCar(colors[Math.floor(Math.random() * colors.length)], false);
        
        // Pick a random road
        this.isHorizontal = Math.random() > 0.5;
        const roadIndex = (Math.floor(Math.random() * (MAP_SIZE / BLOCK_SIZE)) - (MAP_SIZE / BLOCK_SIZE) / 2) * BLOCK_SIZE;
        const laneOffset = (Math.random() > 0.5 ? 1 : -1) * (ROAD_WIDTH / 4); // Left or right lane
        
        if (this.isHorizontal) {
            this.mesh.position.set((Math.random() - 0.5) * MAP_SIZE, 0, roadIndex + laneOffset);
            this.direction = (Math.random() > 0.5 ? 1 : -1);
            this.mesh.rotation.y = this.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
        } else {
            this.mesh.position.set(roadIndex + laneOffset, 0, (Math.random() - 0.5) * MAP_SIZE);
            this.direction = (Math.random() > 0.5 ? 1 : -1);
            this.mesh.rotation.y = this.direction === 1 ? 0 : Math.PI;
        }
        
        this.speed = 0.3 + Math.random() * 0.4; // Slower than player max speed
        scene.add(this.mesh);
    }

    update() {
        if (this.isHorizontal) {
            this.mesh.position.x += this.speed * this.direction;
            if (Math.abs(this.mesh.position.x) > MAP_SIZE / 2) this.mesh.position.x *= -1; // Wrap around
        } else {
            this.mesh.position.z += this.speed * this.direction;
            if (Math.abs(this.mesh.position.z) > MAP_SIZE / 2) this.mesh.position.z *= -1; // Wrap around
        }
    }
}

function populateAIBots() {
    for (let i = 0; i < 40; i++) {
        aiBots.push(new AIBot());
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
    gameStarted = true;
    isGameOver = false;
    score = 0;
    speed = 0;
    playerCar.position.set(ROAD_WIDTH / 4, 0, 0);
    playerCar.rotation.y = 0;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

function restartGame() {
    startGame();
}

function checkCollisions() {
    // Car Hitbox approx radius 3
    const hitRadiusSq = 3 * 3;

    // Check AI Bots
    for (let bot of aiBots) {
        const dx = playerCar.position.x - bot.mesh.position.x;
        const dz = playerCar.position.z - bot.mesh.position.z;
        if (dx*dx + dz*dz < hitRadiusSq) {
            gameOver();
            return;
        }
    }

    // Check Speed Breakers
    if (bumpTimer === 0) {
        for (let sb of speedBreakers) {
            const isHit = sb.isHorizontal 
                ? (Math.abs(playerCar.position.z - sb.z) < 2 && Math.abs(playerCar.position.x - sb.x) < ROAD_WIDTH/2)
                : (Math.abs(playerCar.position.x - sb.x) < 2 && Math.abs(playerCar.position.z - sb.z) < ROAD_WIDTH/2);
            
            if (isHit && Math.abs(speed) > 0.2) {
                // Apply speed bump penalty
                speed *= 0.5;
                bumpTimer = 15; // Frames of camera shake
                break;
            }
        }
    }
}

function gameOver() {
    isGameOver = true;
    gameStarted = false;
    finalScoreElement.innerText = Math.floor(score);
    gameOverScreen.classList.remove('hidden');
}

function animate() {
    requestAnimationFrame(animate);

    if (gameStarted && !isGameOver) {
        // Player Physics
        if (keys.ArrowUp || keys.w) speed += acceleration;
        else if (keys.ArrowDown || keys.s) speed -= acceleration;
        else {
            if (speed > 0) speed = Math.max(0, speed - friction);
            if (speed < 0) speed = Math.min(0, speed + friction);
        }

        speed = Math.max(-maxSpeed/2, Math.min(maxSpeed, speed));

        // Steering
        if (Math.abs(speed) > 0.05) {
            const turnDir = speed > 0 ? 1 : -1;
            if (keys.ArrowLeft || keys.a) playerCar.rotation.y += turnSpeed * turnDir;
            if (keys.ArrowRight || keys.d) playerCar.rotation.y -= turnSpeed * turnDir;
        }

        // Move Player
        playerCar.position.x += Math.sin(playerCar.rotation.y) * speed;
        playerCar.position.z += Math.cos(playerCar.rotation.y) * speed;

        // Keep player in bounds roughly
        playerCar.position.x = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, playerCar.position.x));
        playerCar.position.z = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, playerCar.position.z));

        // Update Score and UI
        if (speed > 0) score += speed * 0.1;
        scoreElement.innerText = Math.floor(score);
        speedElement.innerText = Math.floor(Math.abs(speed) * 100);

        // Update AI
        aiBots.forEach(bot => bot.update());

        // Collisions
        checkCollisions();

        // Camera Follow
        const relativeCameraOffset = cameraOffset.clone();
        const cameraFollowMatrix = new THREE.Matrix4().extractRotation(playerCar.matrixWorld);
        const transformedOffset = relativeCameraOffset.applyMatrix4(cameraFollowMatrix);
        
        let targetCamPos = playerCar.position.clone().add(transformedOffset);
        
        // Apply bump shake
        if (bumpTimer > 0) {
            targetCamPos.y += Math.sin(bumpTimer) * 0.5;
            bumpTimer--;
        }

        camera.position.lerp(targetCamPos, 0.1);
        camera.lookAt(playerCar.position);
    }

    renderer.render(scene, camera);
}

// Start Initialization
window.onload = init3D;
