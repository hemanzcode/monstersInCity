const socket = io();

// Multiplayer variables
const otherPlayers = {};
let lastUpdateTime = 0;

// Original Global game variables
let scene, camera, renderer, player;
let enemies = [], buildings = [], vehicles = [], projectiles = [], pickups = [], pedestrians = [], sidewalks = [], roads = [], walkways = [], ramps = [], train;
let safeZone, portal;
let health = 100, stamina = 100, score = 0, level = 1, hasWeapon = false;
let gameOver = false, gameStarted = false;
let keys = {}, velocity = new THREE.Vector3();
let canJump = true, walkCycle = 0;
let leftArm, rightArm, leftLeg, rightLeg;
let cameraMode = 'third';
let worldTheme = 0;
let isInTrain = false;
let raycaster = new THREE.Raycaster();
let cameraOffset = 0;
let isMobile = false;

// --- All Game Functions (defined before use) ---

function createPlayer() {
    const group = new THREE.Object3D();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x003366, emissiveIntensity: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), bodyMat);
    body.position.y = 0.6;
    group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xffcc99 }));
    head.position.y = 1.5;
    group.add(head);
    const pLeftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), bodyMat);
    pLeftArm.position.set(-0.55, 0.6, 0);
    group.add(pLeftArm);
    const pRightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), bodyMat);
    pRightArm.position.set(0.55, 0.6, 0);
    group.add(pRightArm);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x003366 });
    const pLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), legMat);
    pLeftLeg.position.set(-0.25, -0.45, 0);
    group.add(pLeftLeg);
    const pRightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), legMat);
    pRightLeg.position.set(0.25, -0.45, 0);
    group.add(pRightLeg);
    group.leftArm = pLeftArm; group.rightArm = pRightArm; group.leftLeg = pLeftLeg; group.rightLeg = pRightLeg;
    return group;
}

function createDino() {
    const group = new THREE.Object3D();
    const mat = new THREE.MeshStandardMaterial({ color: 0x008000, emissive: 0x003300, emissiveIntensity: 0.5 }); // Darker green

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.25, 1.5), mat);
    body.position.y = 1.125;
    group.add(body);

    // Head Group
    const headGroup = new THREE.Object3D();
    headGroup.position.set(0, 1.7, 1.5);
    group.add(headGroup);

    // Upper Jaw
    const upperJaw = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.8), mat);
    upperJaw.position.y = 0.3;
    headGroup.add(upperJaw);

    // Lower Jaw
    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.7), mat);
    lowerJaw.position.y = -0.25;
    headGroup.add(lowerJaw);
    group.lowerJaw = lowerJaw; // Attach for animation access

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.22), eyeMat);
    eye1.position.set(-0.375, 0.5, 0.7);
    upperJaw.add(eye1); // Add to upper jaw

    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.22), eyeMat);
    eye2.position.set(0.375, 0.5, 0.7);
    upperJaw.add(eye2); // Add to upper jaw

    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 3), mat);
    tail.position.set(0, 1.05, -2.25);
    tail.rotation.x = -0.3;
    group.add(tail);

    // Legs
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), mat);
    leg1.position.set(-0.9, 0, -0.75);
    group.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), mat);
    leg2.position.set(0.9, 0, -0.75);
    group.add(leg2);

    return group;
}

function createLabel(text, color, scale = 5) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512; canvas.height = 128;
    ctx.fillStyle = color; ctx.font = 'bold 60px Courier New';
    ctx.textAlign = 'center'; ctx.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.scale.set(scale, scale / 4, 1);
    return sprite;
}

function createRedCross() {
    const group = new THREE.Object3D();
    const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.9 });
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), mat);
    vertical.position.y = 0.8;
    group.add(vertical);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.4), mat);
    horizontal.position.y = 0.8;
    group.add(horizontal);
    return group;
}

function updateWorldTheme() {
    if (!scene) return;
    const themes = [ { name: 'Noite', fog: 0x000a1f, ambient: 0x0a0a2e, ground: 0x0a0a1f, sidewalk: 0x333333 }, { name: 'Manhã', fog: 0x87ceeb, ambient: 0xffffff, ground: 0x3a3a3a, sidewalk: 0x666666 }];
    const theme = themes[worldTheme % themes.length];
    scene.fog = new THREE.FogExp2(theme.fog, 0.008);
    const ambientLight = scene.children.find(c => c instanceof THREE.AmbientLight);
    if (ambientLight) {
        ambientLight.color.setHex(theme.ambient);
        ambientLight.intensity = worldTheme === 0 ? 0.3 : 0.6;
    }
}

function generateWorld() {
    [buildings, enemies, vehicles, pickups, pedestrians, sidewalks, roads, walkways, ramps].forEach(arr => {
        arr.forEach(item => scene.remove(item.mesh || item));
    });
    if (train) scene.remove(train.mesh);
    if (safeZone) scene.remove(safeZone);
    if (portal) scene.remove(portal);

    buildings = []; enemies = []; vehicles = []; pickups = []; pedestrians = []; sidewalks = []; roads = []; walkways = []; ramps = [];
    train = null; safeZone = null; portal = null;

    worldTheme++;
    updateWorldTheme();

    const currentTheme = { ground: 0x0a0a1f, sidewalk: 0x333333 };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: currentTheme.ground }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    for (let i = -2; i <= 2; i++) {
        const road = new THREE.Mesh(new THREE.PlaneGeometry(500, 10), new THREE.MeshStandardMaterial({ color: 0x1c2526 }));
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.01, i * 20);
        roads.push(road);
        scene.add(road);
    }

    for (let i = 0; i < 30; i++) {
        const h = Math.random() * 30 + 10;
        const w = Math.random() * 8 + 5;
        const d = Math.random() * 8 + 5;
        const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x1a1a3e, emissive: Math.random() > 0.7 ? 0x00ffff : 0xff00ff, emissiveIntensity: 0.2 }));
        const a = Math.random() * Math.PI * 2;
        const dist = Math.random() * 80 + 30;
        building.position.set(Math.cos(a) * dist, h / 2, Math.sin(a) * dist);
        buildings.push(building);
        scene.add(building);
    }

    for (let i = 0; i < 10; i++) {
        const car = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 3), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
        car.position.set(Math.random() * 100 - 50, 1.5, (Math.floor(Math.random() * 5) - 2) * 20);
        vehicles.push({ mesh: car, speed: (Math.random() * 0.25 + 0.15) * (Math.random() > 0.5 ? 1 : -1) });
        scene.add(car);
    }

    for (let i = 0; i < 8; i++) {
        const type = Math.random();
        let pickup, labelText, labelColor;
        if (type > 0.7) { pickup = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.9 })); pickup.type = 'weapon'; labelText = 'ARMA'; labelColor = '#ffff00'; }
        else if (type > 0.3) { pickup = createRedCross(); pickup.type = 'health'; labelText = 'MEDICAMENTO'; labelColor = '#ff0000'; }
        else { pickup = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 0.9 })); pickup.type = 'food'; labelText = 'COMIDA'; labelColor = '#ffa500'; }
        pickup.position.set(Math.random() * 60 - 30, 0.5, Math.random() * 60 - 30);
        const label = createLabel(labelText, labelColor);
        label.position.y = 2.5;
        pickup.add(label);
        pickups.push({ mesh: pickup, type: pickup.type, rotation: 0 });
        scene.add(pickup);
    }

    for (let i = 0; i < 5 + level; i++) {
        const dino = createDino();
        const a = Math.random() * Math.PI * 2;
        const dist = Math.random() * 40 + 20;
        dino.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
        enemies.push({ mesh: dino, speed: 0.05 + level * 0.01, health: 5 });
        scene.add(dino);
    }
}

function checkCollision(x, z) {
    const r = 1.5;
    for (let b of buildings) {
        const box = new THREE.Box3().setFromObject(b);
        if (x > box.min.x - r && x < box.max.x + r && z > box.min.z - r && z < box.max.z + r) return true;
    }
    for (let v of vehicles) {
        const box = new THREE.Box3().setFromObject(v.mesh);
        if (x > box.min.x - r && x < box.max.x + r && z > box.min.z - r && z < box.max.z + r) return true;
    }
    for (const id in otherPlayers) {
        const otherPlayer = otherPlayers[id];
        const d = Math.sqrt((x - otherPlayer.mesh.position.x)**2 + (z - otherPlayer.mesh.position.z)**2);
        if (d < r * 2) return true;
    }
    return false;
}

function update() {
    if (gameOver) {
        document.getElementById('gameOver').style.display = 'block';
        return;
    }
    if (!gameStarted || !player) return;

    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
    const baseSpeed = isRunning ? 0.25 : 0.15;
    const speed = stamina > 0 ? baseSpeed : baseSpeed * 0.5;
    let moving = false;
    let moveX = 0, moveZ = 0;

    if (keys['KeyW']) moveZ = 1;
    if (keys['KeyS']) moveZ = -1;
    if (keys['KeyA']) moveX = 1;
    if (keys['KeyD']) moveX = -1;
    if (moveX !== 0 || moveZ !== 0) moving = true;

    if (moving) {
        const nx = player.position.x + moveX * speed;
        const nz = player.position.z + moveZ * speed;
        if (!checkCollision(nx, nz)) { player.position.x = nx; player.position.z = nz; }
        player.rotation.y = Math.atan2(moveX, moveZ);
        stamina = Math.max(0, stamina - (isRunning ? 0.1 : 0.05));
    } else {
        stamina = Math.min(100, stamina + 0.3);
    }

    if (moving) {
        walkCycle += 0.15;
        const swing = Math.sin(walkCycle) * 0.4;
        if(player.leftArm) { player.leftArm.rotation.x = swing; player.rightArm.rotation.x = -swing; player.leftLeg.rotation.x = -swing * 0.8; player.rightLeg.rotation.x = swing * 0.8; }
    } else {
        walkCycle = 0;
        if(player.leftArm) { player.leftArm.rotation.x = 0; player.rightArm.rotation.x = 0; player.leftLeg.rotation.x = 0; player.rightLeg.rotation.x = 0; }
    }
    
    velocity.y -= 0.02;
    player.position.y += velocity.y;
    if (player.position.y <= 2) { player.position.y = 2; velocity.y = 0; canJump = true; }

    enemies.forEach((e, i) => {
        if (e.isDead) { e.mesh.rotation.x += 0.05; e.mesh.position.y -= 0.02; if (e.mesh.position.y < -5) { scene.remove(e.mesh); enemies.splice(i, 1); } return; }
        const dir = new THREE.Vector3().subVectors(player.position, e.mesh.position).normalize();
        const distToPlayer = player.position.distanceTo(e.mesh.position);
        if (distToPlayer > 0.1) { e.mesh.position.add(dir.multiplyScalar(e.speed)); }
        e.mesh.rotation.y = Math.atan2(player.position.x - e.mesh.position.x, player.position.z - e.mesh.position.z);
        if (distToPlayer < 3) {
            // Always deal damage when close
            health -= 0.5;
            if (health <= 0) {
                gameOver = true;
                document.getElementById('gameOver').style.display = 'block';
            }

            // Handle the animation separately
            e.biteAnimation = (e.biteAnimation || 0) + 0.3;
            if (e.mesh.lowerJaw) {
                e.mesh.lowerJaw.rotation.x = Math.abs(Math.sin(e.biteAnimation) * 0.8);
            }
        } else {
            if (e.mesh.lowerJaw) {
                e.mesh.lowerJaw.rotation.x = 0; // Close mouth
            }
        }
        projectiles.forEach((p, pi) => {
            if (e.mesh.position.distanceTo(p.mesh.position) < 3.5) {
                e.health--;
                scene.remove(p.mesh);
                projectiles.splice(pi, 1);
                if (e.health <= 0) { e.isDead = true; score += 25; }
            }
        });
    });

    vehicles.forEach(v => {
        v.mesh.position.x += v.speed;
        if (Math.abs(v.mesh.position.x) > 100) v.mesh.position.x = -v.mesh.position.x;
        const carBox = new THREE.Box3().setFromObject(v.mesh);
        const playerBox = new THREE.Box3().setFromObject(player);
        if(carBox.intersectsBox(playerBox)) { health -= 1; if (health <= 0) gameOver = true; }
    });

    pickups.forEach((p, i) => {
        const d = player.position.distanceTo(p.mesh.position);
        if (d < 3) {
            if (p.type === 'weapon') { hasWeapon = true; document.getElementById('weapon').textContent = 'Bazuca Verde'; score += 50; }
            else if (p.type === 'health') { health = Math.min(100, health + 30); }
            else if (p.type === 'food') { stamina = Math.min(100, stamina + 70); }
            scene.remove(p.mesh);
            pickups.splice(i, 1);
        }
    });

    projectiles.forEach((p, i) => {
        p.mesh.position.add(p.velocity);
        let remove = false;
        for (let b of buildings) { if (new THREE.Box3().setFromObject(b).intersectsBox(new THREE.Box3().setFromObject(p.mesh))) { remove = true; break; } }
        if (remove || p.mesh.position.length() > 200) { scene.remove(p.mesh); projectiles.splice(i, 1); }
    });

    const d = 15, h = 8;
    camera.position.x = player.position.x; camera.position.y = player.position.y + h; camera.position.z = player.position.z - d;
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);

    const now = Date.now();
    if (now - lastUpdateTime > 100) {
        socket.emit('playerUpdate', { position: player.position, rotation: player.rotation });
        lastUpdateTime = now;
    }

    document.getElementById('health').textContent = Math.max(0, Math.floor(health));
    document.getElementById('stamina').textContent = Math.max(0, Math.floor(stamina));
}

function animate() {
    requestAnimationFrame(animate);
    if (gameStarted) update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function init() {
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x0a0a2e, 0.3));
    const light = new THREE.DirectionalLight(0x00ffff, 0.5);
    light.position.set(50, 100, 50);
    scene.add(light);
    updateWorldTheme();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    player = createPlayer();
    player.position.set(0, 2, 0);
    scene.add(player);
    leftArm = player.leftArm; rightArm = player.rightArm; leftLeg = player.leftLeg; rightLeg = player.rightLeg;
    generateWorld();
    setupMobileControls();
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyR' && gameOver) location.reload();
        if (e.code === 'Space' && canJump && stamina > 10 && !gameOver && gameStarted) {
            velocity.y = 0.5;
            canJump = false;
            stamina = Math.max(0, stamina - 5);
        }
    });
    document.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (e.code === 'Space') canJump = true;
    });
    document.addEventListener('click', () => {
        if (!hasWeapon || gameOver || !gameStarted) return;
        const proj = new THREE.Mesh(
            new THREE.SphereGeometry(0.3),
            new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 })
        );
        proj.position.copy(player.position);
        proj.position.y += 1;
        const dir = new THREE.Vector3(
            Math.sin(player.rotation.y),
            0,
            Math.cos(player.rotation.y)
        );
        projectiles.push({ mesh: proj, velocity: dir.multiplyScalar(0.8) });
        scene.add(proj);
    });
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    animate();
}

// --- UI and Socket Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const createRoomBtn = document.getElementById('createRoomBtn');
    createRoomBtn.addEventListener('click', () => socket.emit('createRoom'));
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    joinRoomBtn.addEventListener('click', () => {
        const roomId = document.getElementById('roomIdInput').value;
        if (roomId) socket.emit('joinRoom', roomId);
    });
});

function startGame() {
    document.getElementById('roomScreen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    gameStarted = true;
    init();
}

socket.on('roomCreated', (roomId) => {
    document.getElementById('roomIdDisplay').textContent = `ID da Sala: ${roomId}`;
    startGame();
});

socket.on('joinedRoom', (initialPlayers) => {
    startGame();
    for (const playerId in initialPlayers) {
        if (playerId !== socket.id) {
            const playerData = initialPlayers[playerId];
            const newPlayer = createPlayer();
            newPlayer.position.copy(playerData.position);
            newPlayer.rotation.copy(playerData.rotation);
            otherPlayers[playerId] = { mesh: newPlayer };
            if(scene) scene.add(newPlayer);
        }
    }
});

socket.on('playerJoined', (data) => {
    if (!otherPlayers[data.id] && data.id !== socket.id) {
        const newPlayer = createPlayer();
        newPlayer.position.copy(data.position);
        otherPlayers[data.id] = { mesh: newPlayer };
        if(scene) scene.add(newPlayer);
    }
});

socket.on('playerLeft', (playerId) => {
    if (otherPlayers[playerId]) {
        if(scene) scene.remove(otherPlayers[playerId].mesh);
        delete otherPlayers[playerId];
    }
});

socket.on('playerUpdate', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].mesh.position.copy(data.position);
        otherPlayers[data.id].mesh.rotation.copy(data.rotation);
    }
});

socket.on('error', (message) => alert(message));

function setupMobileControls() { /* ... */ }