// Variáveis globais
        let scene, camera, renderer, player;
        let enemies = [], buildings = [], vehicles = [], projectiles = [], pickups = [], pedestrians = [], sidewalks = [], roads = [], walkways = [], ramps = [], train;
        let safeZone, portal;
        let health = 100, stamina = 100, score = 0, level = 1, hasWeapon = false;
        let gameOver = false, gameStarted = false;
        let keys = {}, velocity = new THREE.Vector3();
        let canJump = true, walkCycle = 0;
        let leftArm, rightArm, leftLeg, rightLeg;
        let cameraMode = 'third'; // 'third', 'first', 'god'
        let worldTheme = 0;
        let isInTrain = false;
        let raycaster = new THREE.Raycaster();
        let cameraOffset = 0; // Para ajustar altura da câmera em caso de obstrução
        let isMobile = false; // Detectar se é mobile

        // Detectar dispositivo mobile
        function detectMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            return isMobileDevice || isTouchDevice;
        }

        // Configurar controles mobile
        function setupMobileControls() {
            isMobile = detectMobile();
            
            if (isMobile) {
                document.getElementById('mobileControls').style.display = 'block';
                document.getElementById('crosshair').style.display = 'none';
                document.getElementById('instructions').textContent = 'Use os controles na tela para jogar';
                
                // Função auxiliar para simular tecla pressionada
                const simulateKey = (keyCode, isPressed) => {
                    keys[keyCode] = isPressed;
                };

                // D-pad - Movimento
                const btnUp = document.getElementById('btnUp');
                const btnDown = document.getElementById('btnDown');
                const btnLeft = document.getElementById('btnLeft');
                const btnRight = document.getElementById('btnRight');
                
                // Eventos para botão CIMA (W)
                btnUp.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    simulateKey('KeyW', true);
                });
                btnUp.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    simulateKey('KeyW', false);
                });
                btnUp.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    simulateKey('KeyW', false);
                });

                // Eventos para botão BAIXO (S)
                btnDown.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    simulateKey('KeyS', true);
                });
                btnDown.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    simulateKey('KeyS', false);
                });
                btnDown.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    simulateKey('KeyS', false);
                });

                // Eventos para botão ESQUERDA (A)
                btnLeft.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    simulateKey('KeyA', true);
                });
                btnLeft.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    simulateKey('KeyA', false);
                });
                btnLeft.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    simulateKey('KeyA', false);
                });

                // Eventos para botão DIREITA (D)
                btnRight.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    simulateKey('KeyD', true);
                });
                btnRight.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    simulateKey('KeyD', false);
                });
                btnRight.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    simulateKey('KeyD', false);
                });

                // Botão PULAR
                const btnJump = document.getElementById('btnJump');
                btnJump.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (canJump && stamina > 10 && !gameOver && gameStarted) {
                        velocity.y = 0.5;
                        canJump = false;
                        stamina = Math.max(0, stamina - 5);
                    }
                });
                btnJump.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    canJump = true;
                });

                // Botão ATIRAR
                const btnShoot = document.getElementById('btnShoot');
                btnShoot.addEventListener('touchstart', (e) => {
                    e.preventDefault();
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

                // Botão CORRER
                const btnRun = document.getElementById('btnRun');
                btnRun.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    simulateKey('ShiftLeft', true);
                });
                btnRun.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    simulateKey('ShiftLeft', false);
                });
                btnRun.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    simulateKey('ShiftLeft', false);
                });

                // Botão CÂMERA
                const btnCamera = document.getElementById('btnCamera');
                btnCamera.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!gameOver && gameStarted) {
                        if (cameraMode === 'third') {
                            cameraMode = 'first';
                        } else if (cameraMode === 'first') {
                            cameraMode = 'god';
                        } else {
                            cameraMode = 'third';
                        }
                    }
                });
            }
        }

        // Função para criar o jogador
        function createPlayer() {
            const group = new THREE.Object3D();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x003366, emissiveIntensity: 0.2 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), bodyMat);
            body.position.y = 0.6;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xffcc99 }));
            head.position.y = 1.5;
            group.add(head);

            leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), bodyMat);
            leftArm.position.set(-0.55, 0.6, 0);
            group.add(leftArm);

            rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), bodyMat);
            rightArm.position.set(0.55, 0.6, 0);
            group.add(rightArm);

            const legMat = new THREE.MeshStandardMaterial({ color: 0x003366 });
            leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), legMat);
            leftLeg.position.set(-0.25, -0.45, 0);
            group.add(leftLeg);

            rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), legMat);
            rightLeg.position.set(0.25, -0.45, 0);
            group.add(rightLeg);

            return group;
        }

        // Função para criar dinossauro
        function createDino() {
            const group = new THREE.Object3D();
            const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.25, 1.5), mat);
            body.position.y = 1.125;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.8), mat);
            head.position.set(0, 1.5, 1.8);
            group.add(head);

            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 3), mat);
            tail.position.set(0, 1.05, -2.25);
            tail.rotation.x = -0.3;
            group.add(tail);

            const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), mat);
            leg1.position.set(-0.9, 0, -0.75);
            group.add(leg1);

            const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.5, 0.45), mat);
            leg2.position.set(0.9, 0, -0.75);
            group.add(leg2);

            const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 });
            const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.22), eyeMat);
            eye1.position.set(-0.375, 1.8, 2.55);
            group.add(eye1);

            const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.22), eyeMat);
            eye2.position.set(0.375, 1.8, 2.55);
            group.add(eye2);

            return group;
        }

        // Função para criar rótulos
        function createLabel(text, color, scale = 5) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 128;
            ctx.fillStyle = color;
            ctx.font = 'bold 60px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(text, 256, 64);

            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
            sprite.scale.set(scale, scale / 4, 1);
            return sprite;
        }

        // Função para criar pedestre
        function createPedestrian(isInteractive = false) {
            const group = new THREE.Object3D();
            const colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff0088, 0x00ff88];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const bodyMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.3), bodyMat);
            body.position.y = 0.5;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffcc99 }));
            head.position.y = 1.2;
            group.add(head);

            if (isInteractive) {
                const label = createLabel('Portal está a ' + (Math.random() > 0.5 ? 'norte' : 'sul'), '#ffffff', 6); // Aumentado scale para 6
                label.position.y = 2;
                label.visible = false;
                group.add(label);
            }

            return group;
        }

        // Função para criar cruz vermelha (medicamento)
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

        // Função para criar trem
        function createTrain() {
            const group = new THREE.Object3D();
            const mat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x00ffff, emissiveIntensity: 0.5 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 4), mat);
            body.position.y = 1.5;
            group.add(body);

            const wheels = [];
            const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
            const wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);

            for (let i = -1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(i * 3, 0.3, j * 2);
                    group.add(wheel);
                    wheels.push(wheel);
                }
            }

            return { mesh: group, wheels, speed: 0.3, axis: 'x' };
        }

        // Função para criar explosão
        function createExplosion(position) {
            const explosionGroup = new THREE.Object3D();

            for (let i = 0; i < 8; i++) {
                const size = Math.random() * 1.5 + 0.5;
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(size, 8, 8),
                    new THREE.MeshStandardMaterial({
                        color: Math.random() > 0.5 ? 0xff6600 : 0xffff00,
                        emissive: Math.random() > 0.5 ? 0xff6600 : 0xffff00,
                        emissiveIntensity: 2,
                        transparent: true,
                        opacity: 1
                    })
                );
                sphere.position.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                );
                explosionGroup.add(sphere);
            }

            explosionGroup.position.copy(position);
            scene.add(explosionGroup);

            let scale = 1;
            const interval = setInterval(() => {
                scale += 0.3;
                explosionGroup.scale.set(scale, scale, scale);
                explosionGroup.children.forEach(child => {
                    child.material.opacity -= 0.1;
                });

                if (scale > 4) {
                    clearInterval(interval);
                    scene.remove(explosionGroup);
                }
            }, 50);
        }

        // Função para inicializar a cena
        function init() {
            scene = new THREE.Scene();
            updateWorldTheme();

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            document.body.appendChild(renderer.domElement);

            scene.add(new THREE.AmbientLight(0x0a0a2e, 0.3));
            const light = new THREE.DirectionalLight(0x00ffff, 0.5);
            light.position.set(50, 100, 50);
            scene.add(light);

            player = createPlayer();
            player.position.set(0, 2, 0);
            scene.add(player);

            generateWorld();

            document.addEventListener('keydown', e => {
                keys[e.code] = true;
                if (e.code === 'KeyR' && gameOver) location.reload();
                if (e.code === 'KeyT' && !gameOver && gameStarted) {
                    cameraMode = cameraMode === 'first' ? 'third' : 'first';
                }
                if (e.code === 'KeyG' && !gameOver && gameStarted) {
                    cameraMode = cameraMode === 'god' ? 'third' : 'god';
                }
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
        }

        // Função para atualizar o tema do mundo
        function updateWorldTheme() {
            const themes = [
                { name: 'Noite', fog: 0x000a1f, ambient: 0x0a0a2e, ground: 0x0a0a1f, sidewalk: 0x333333 },
                { name: 'Manhã', fog: 0x87ceeb, ambient: 0xffffff, ground: 0x3a3a3a, sidewalk: 0x666666 },
                { name: 'Tarde', fog: 0xffa500, ambient: 0xffcc88, ground: 0x4a4a4a, sidewalk: 0x777777 },
                { name: 'Pôr do Sol', fog: 0xff6347, ambient: 0xff8866, ground: 0x2a2a2a, sidewalk: 0x555555 }
            ];

            const theme = themes[worldTheme % themes.length];
            scene.fog = new THREE.FogExp2(theme.fog, 0.008);

            scene.children.forEach(child => {
                if (child instanceof THREE.AmbientLight) {
                    child.color.setHex(theme.ambient);
                    child.intensity = worldTheme === 0 ? 0.3 : 0.6;
                }
            });
        }

        // Função para gerar o mundo
        function generateWorld() {
            buildings.forEach(b => scene.remove(b));
            enemies.forEach(e => scene.remove(e.mesh));
            vehicles.forEach(v => scene.remove(v.mesh));
            pickups.forEach(p => scene.remove(p.mesh));
            pedestrians.forEach(p => scene.remove(p.mesh));
            sidewalks.forEach(s => scene.remove(s));
            roads.forEach(r => scene.remove(r));
            walkways.forEach(w => scene.remove(w));
            ramps.forEach(r => scene.remove(r));
            if (train) scene.remove(train.mesh);
            if (safeZone) scene.remove(safeZone);
            if (portal) scene.remove(portal);

            buildings = [];
            enemies = [];
            vehicles = [];
            pickups = [];
            pedestrians = [];
            sidewalks = [];
            roads = [];
            walkways = [];
            ramps = [];
            train = null;

            worldTheme++;
            updateWorldTheme();

            const themes = [
                { ground: 0x0a0a1f, sidewalk: 0x333333 },
                { ground: 0x3a3a3a, sidewalk: 0x666666 },
                { ground: 0x4a4a4a, sidewalk: 0x777777 },
                { ground: 0x2a2a2a, sidewalk: 0x555555 }
            ];
            const currentTheme = themes[worldTheme % themes.length];

            // Chão base
            const ground = new THREE.Mesh(
                new THREE.PlaneGeometry(500, 500),
                new THREE.MeshStandardMaterial({ color: currentTheme.ground })
            );
            ground.rotation.x = -Math.PI / 2;
            scene.add(ground);

            // Pistas para carros
            for (let i = -2; i <= 2; i++) {
                const road = new THREE.Mesh(
                    new THREE.PlaneGeometry(500, 10),
                    new THREE.MeshStandardMaterial({ color: 0x1c2526 })
                );
                road.rotation.x = -Math.PI / 2;
                road.position.set(0, 0.01, i * 20);
                roads.push(road);
                scene.add(road);
            }

            // Calçadas
            for (let i = -2; i <= 2; i++) {
                const sidewalk1 = new THREE.Mesh(
                    new THREE.BoxGeometry(500, 0.2, 5),
                    new THREE.MeshStandardMaterial({ color: currentTheme.sidewalk })
                );
                sidewalk1.position.set(0, 0.1, i * 20 + 7.5);
                sidewalks.push(sidewalk1);
                scene.add(sidewalk1);

                const sidewalk2 = new THREE.Mesh(
                    new THREE.BoxGeometry(500, 0.2, 5),
                    new THREE.MeshStandardMaterial({ color: currentTheme.sidewalk })
                );
                sidewalk2.position.set(0, 0.1, i * 20 - 7.5);
                sidewalks.push(sidewalk2);
                scene.add(sidewalk2);
            }

            // Passarelas com rampas
            for (let i = -1; i <= 1; i++) {
                const walkway = new THREE.Mesh(
                    new THREE.BoxGeometry(10, 0.3, 20),
                    new THREE.MeshStandardMaterial({ color: 0x555555 })
                );
                walkway.position.set(i * 20, 3, 0);
                walkways.push(walkway);
                scene.add(walkway);

                // Suportes da passarela
                const support1 = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 3, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                support1.position.set(i * 20 - 5, 1.5, -10);
                scene.add(support1);

                const support2 = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 3, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                support2.position.set(i * 20 + 5, 1.5, -10);
                scene.add(support2);

                const support3 = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 3, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                support3.position.set(i * 20 - 5, 1.5, 10);
                scene.add(support3);

                const support4 = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 3, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                support4.position.set(i * 20 + 5, 1.5, 10);
                scene.add(support4);

                // Rampas
                const ramp1 = new THREE.Mesh(
                    new THREE.BoxGeometry(10, 0.3, 5),
                    new THREE.MeshStandardMaterial({ color: 0x555555 })
                );
                ramp1.position.set(i * 20, 1.5, 12.5);
                ramp1.rotation.x = Math.PI / 6;
                ramps.push(ramp1);
                scene.add(ramp1);

                const ramp2 = new THREE.Mesh(
                    new THREE.BoxGeometry(10, 0.3, 5),
                    new THREE.MeshStandardMaterial({ color: 0x555555 })
                );
                ramp2.position.set(i * 20, 1.5, -12.5);
                ramp2.rotation.x = -Math.PI / 6;
                ramps.push(ramp2);
                scene.add(ramp2);
            }

            // Trem
            train = createTrain();
            train.mesh.position.set(-50, 0, 50);
            scene.add(train.mesh);

            for (let i = 0; i < 30; i++) {
                const h = Math.random() * 30 + 10;
                const w = Math.random() * 8 + 5;
                const d = Math.random() * 8 + 5;
                const building = new THREE.Mesh(
                    new THREE.BoxGeometry(w, h, d),
                    new THREE.MeshStandardMaterial({
                        color: Math.random() > 0.5 ? 0x1a1a3e : 0x2e1a3e,
                        emissive: Math.random() > 0.7 ? 0x00ffff : 0xff00ff,
                        emissiveIntensity: 0.2
                    })
                );
                const a = Math.random() * Math.PI * 2;
                const dist = Math.random() * 80 + 30;
                building.position.set(Math.cos(a) * dist, h / 2, Math.sin(a) * dist);
                buildings.push(building);
                scene.add(building);
            }

            for (let i = 0; i < 10; i++) {
                const carGroup = new THREE.Object3D();
                const car = new THREE.Mesh(
                    new THREE.BoxGeometry(6, 3, 3),
                    new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
                );
                car.position.y = 0.75;
                carGroup.add(car);

                const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
                const wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);

                const wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
                wheel1.rotation.z = Math.PI / 2;
                wheel1.position.set(-2.2, -0.15, 1.8);
                carGroup.add(wheel1);

                const wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
                wheel2.rotation.z = Math.PI / 2;
                wheel2.position.set(-2.2, -0.15, -1.8);
                carGroup.add(wheel2);

                const wheel3 = new THREE.Mesh(wheelGeom, wheelMat);
                wheel3.rotation.z = Math.PI / 2;
                wheel3.position.set(2.2, -0.15, 1.8);
                carGroup.add(wheel3);

                const wheel4 = new THREE.Mesh(wheelGeom, wheelMat);
                wheel4.rotation.z = Math.PI / 2;
                wheel4.position.set(2.2, -0.15, -1.8);
                carGroup.add(wheel4);

                carGroup.position.set(Math.random() * 100 - 50, 0, (Math.floor(Math.random() * 5) - 2) * 20);
                vehicles.push({
                    mesh: carGroup,
                    wheels: [wheel1, wheel2, wheel3, wheel4],
                    speed: (Math.random() * 0.25 + 0.15) * (Math.random() > 0.5 ? 1 : -1),
                    axis: 'x'
                });
                scene.add(carGroup);
            }

            for (let i = 0; i < 3 + level * 2; i++) {
                const dino = createDino();
                const a = Math.random() * Math.PI * 2;
                const dist = Math.random() * 40 + 20;
                dino.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
                enemies.push({
                    mesh: dino,
                    speed: 0.05 + level * 0.01,
                    health: 5,
                    biteAnimation: 0,
                    isDead: false
                });
                scene.add(dino);
            }

            for (let i = 0; i < 15; i++) {
                const isInteractive = Math.random() > 0.7;
                const ped = createPedestrian(isInteractive);
                const sidewalkIndex = Math.floor(Math.random() * 5);
                ped.position.set(
                    Math.random() * 80 - 40,
                    0.2,
                    (sidewalkIndex - 2) * 20 + (sidewalkIndex % 2 === 0 ? 7.5 : -7.5)
                );
                const walkDir = Math.random() * Math.PI * 2;
                pedestrians.push({
                    mesh: ped,
                    direction: walkDir,
                    speed: 0.03 + Math.random() * 0.02,
                    walkCycle: Math.random() * 10,
                    isInteractive
                });
                scene.add(ped);
            }

            // Aumentar número de pickups de comida para 8 (mais caixas de comida)
            for (let i = 0; i < 8; i++) {
                const type = Math.random();
                let pickup;
                let label;
                if (type > 0.7) {
                    pickup = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 1),
                        new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.9 })
                    );
                    label = createLabel('ARMA', '#ffff00');
                    pickup.type = 'weapon';
                } else if (type > 0.3) {
                    pickup = createRedCross();
                    label = createLabel('MEDICAMENTO', '#ff0000');
                    pickup.type = 'health';
                } else {
                    pickup = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 1),
                        new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 0.9 })
                    );
                    label = createLabel('COMIDA', '#ffa500');
                    pickup.type = 'food';
                }
                pickup.position.set(Math.random() * 60 - 30, 0.5, Math.random() * 60 - 30);
                label.position.y = 2.5;
                pickup.add(label);
                pickups.push({ mesh: pickup, type: pickup.type, rotation: 0 });
                scene.add(pickup);
            }

            safeZone = new THREE.Mesh(
                new THREE.BoxGeometry(8, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5, transparent: true, opacity: 0.6 })
            );
            const sa = Math.random() * Math.PI * 2;
            const sd = Math.random() * 50 + 40;
            safeZone.position.set(Math.cos(sa) * sd, 4, Math.sin(sa) * sd);
            scene.add(safeZone);

            portal = new THREE.Object3D();
            const portalRings = 5;
            for (let i = 0; i < portalRings; i++) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(3 - i * 0.4, 0.15, 16, 32),
                    new THREE.MeshStandardMaterial({
                        color: 0x00ffff,
                        emissive: 0x00ffff,
                        emissiveIntensity: 1,
                        transparent: true,
                        opacity: 0.7 - i * 0.1
                    })
                );
                ring.rotation.y = (i * Math.PI) / portalRings;
                portal.add(ring);
            }

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 32, 32),
                new THREE.MeshStandardMaterial({
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 1.5,
                    transparent: true,
                    opacity: 0.5
                })
            );
            portal.add(core);

            const exitLabel = createLabel('SAIDA', '#00ffff', 8);
            exitLabel.position.y = 5;
            portal.add(exitLabel);

            portal.position.copy(safeZone.position);
            portal.position.y = 4;
            scene.add(portal);
        }

        // Função para verificar colisão
        function checkCollision(x, z, y = player.position.y) {
            const r = 1.5;
            for (let b of buildings) {
                const box = new THREE.Box3().setFromObject(b);
                const pBox = new THREE.Box3(
                    new THREE.Vector3(x - r, y - 1, z - r),
                    new THREE.Vector3(x + r, y + 2, z + r)
                );
                if (box.intersectsBox(pBox)) return true;
            }
            for (let v of vehicles) {
                const box = new THREE.Box3().setFromObject(v.mesh);
                const pBox = new THREE.Box3(
                    new THREE.Vector3(x - r, y - 1, z - r),
                    new THREE.Vector3(x + r, y + 2, z + r)
                );
                if (box.intersectsBox(pBox)) return true;
            }
            for (let w of walkways) {
                const box = new THREE.Box3().setFromObject(w);
                const pBox = new THREE.Box3(
                    new THREE.Vector3(x - r, y - 1, z - r),
                    new THREE.Vector3(x + r, y + 2, z + r)
                );
                if (box.intersectsBox(pBox)) {
                    player.position.y = w.position.y + 1.5;
                    return false;
                }
            }
            for (let r of ramps) {
                const box = new THREE.Box3().setFromObject(r);
                const pBox = new THREE.Box3(
                    new THREE.Vector3(x - r, y - 1, z - r),
                    new THREE.Vector3(x + r, y + 2, z + r)
                );
                if (box.intersectsBox(pBox)) {
                    player.position.y = r.position.y + 1.5;
                    return false;
                }
            }
            return false;
        }

        // Função para ajustar câmera para evitar obstruções
        function adjustCameraForObstructions() {
            if (cameraMode !== 'third') return;

            const playerHead = new THREE.Vector3(player.position.x, player.position.y + 1, player.position.z);
            const cameraPos = camera.position.clone();

            raycaster.set(cameraPos, playerHead.clone().sub(cameraPos).normalize());
            const intersects = raycaster.intersectObjects(buildings, true);

            if (intersects.length > 0) {
                // Se houver obstrução, elevar a câmera
                cameraOffset = Math.min(cameraOffset + 0.5, 10); // Limite de elevação
                camera.position.y += 0.5;
            } else {
                cameraOffset = Math.max(cameraOffset - 0.3, 0); // Reduzir elevação gradualmente
                camera.position.y -= 0.3;
            }
        }

        // Função de atualização do jogo
        function update() {
            if (gameOver) return;

            const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
            const baseSpeed = isRunning ? 0.25 : 0.15;
            const speed = stamina > 0 ? baseSpeed : baseSpeed * 0.5;
            let moving = false;
            let moveX = 0, moveZ = 0;

            if (isInTrain) {
                player.position.copy(train.mesh.position);
                player.position.y = 2;
                cameraMode = 'third';
            } else {
                if (cameraMode === 'god') {
                    if (keys['KeyW']) moveZ = 1;
                    if (keys['KeyS']) moveZ = -1;
                    if (keys['KeyA']) moveX = -1;
                    if (keys['KeyD']) moveX = 1;
                } else {
                    if (keys['KeyW']) moveZ = 1;
                    if (keys['KeyS']) moveZ = -1;
                    if (keys['KeyA']) moveX = 1;
                    if (keys['KeyD']) moveX = -1;
                }
                if (moveX !== 0 || moveZ !== 0) moving = true;

                if (moving) {
                    const nx = player.position.x + moveX * speed;
                    const nz = player.position.z + moveZ * speed;
                    if (!checkCollision(nx, nz)) {
                        player.position.x = nx;
                        player.position.z = nz;
                    }

                    const targetAngle = Math.atan2(moveX, moveZ);
                    player.rotation.y = targetAngle;

                    stamina = Math.max(0, stamina - (isRunning ? 0.1 : 0.05)); // Reduzido consumo
                } else {
                    stamina = Math.min(100, stamina + 0.3); // Aumentada recuperação
                }
            }

            if (moving && !isInTrain) {
                walkCycle += 0.15;
                const swing = Math.sin(walkCycle) * 0.4;
                leftArm.rotation.x = swing;
                rightArm.rotation.x = -swing;
                leftLeg.rotation.x = -swing * 0.8;
                rightLeg.rotation.x = swing * 0.8;
            } else {
                walkCycle = 0;
                leftArm.rotation.x = 0;
                rightArm.rotation.x = 0;
                leftLeg.rotation.x = 0;
                rightLeg.rotation.x = 0;
            }

            velocity.y -= 0.02;
            player.position.y += velocity.y;
            if (player.position.y <= 2) {
                player.position.y = 2;
                velocity.y = 0;
                canJump = true;
            }

            pickups.forEach((p, i) => {
                const d = player.position.distanceTo(p.mesh.position);
                if (d < 3) {
                    if (p.type === 'weapon') {
                        hasWeapon = true;
                        document.getElementById('weapon').textContent = 'Bazuca Verde';
                        score += 50;
                    } else if (p.type === 'health') {
                        health = Math.min(100, health + 30);
                    } else if (p.type === 'food') {
                        stamina = Math.min(100, stamina + 70); // Aumentada recuperação de comida para 70
                    }
                    scene.remove(p.mesh);
                    pickups.splice(i, 1);
                }
            });

            if (safeZone && player.position.distanceTo(safeZone.position) < 8) {
                level++;
                score += 100;
                isInTrain = false;
                generateWorld();
            }

            const lim = 100;
            player.position.x = Math.max(-lim, Math.min(lim, player.position.x));
            player.position.z = Math.max(-lim, Math.min(lim, player.position.z));

            enemies.forEach((e, i) => {
                if (e.isDead) {
                    e.mesh.rotation.x += 0.05;
                    e.mesh.position.y -= 0.02;
                    if (e.mesh.position.y < -5) {
                        scene.remove(e.mesh);
                        enemies.splice(i, 1);
                    }
                    return;
                }

                const dir = new THREE.Vector3().subVectors(player.position, e.mesh.position).normalize();
                const distToPlayer = player.position.distanceTo(e.mesh.position);
                const nx = e.mesh.position.x + dir.x * e.speed;
                const nz = e.mesh.position.z + dir.z * e.speed;

                let hit = false;
                const r = 2;
                for (let b of buildings) {
                    const box = new THREE.Box3().setFromObject(b);
                    const eBox = new THREE.Box3(
                        new THREE.Vector3(nx - r, e.mesh.position.y, nz - r),
                        new THREE.Vector3(nx + r, e.mesh.position.y + 2, nz + r)
                    );
                    if (box.intersectsBox(eBox)) {
                        hit = true;
                        break;
                    }
                }

                if (!hit) {
                    e.mesh.position.x = nx;
                    e.mesh.position.z = nz;
                }

                e.mesh.rotation.y = Math.atan2(player.position.x - e.mesh.position.x, player.position.z - e.mesh.position.z);

                if (distToPlayer < 3) {
                    e.biteAnimation += 0.3;
                    const head = e.mesh.children[1];
                    if (head) {
                        head.rotation.x = Math.sin(e.biteAnimation) * 0.5;
                    }

                    if (Math.sin(e.biteAnimation) > 0.9) {
                        health -= 0.5;
                        if (health <= 0) {
                            gameOver = true;
                            document.getElementById('gameOver').style.display = 'block';
                        }
                    }
                } else {
                    e.biteAnimation = 0;
                    const head = e.mesh.children[1];
                    if (head) {
                        head.rotation.x = 0;
                    }
                }

                projectiles.forEach((p, pi) => {
                    if (e.mesh.position.distanceTo(p.mesh.position) < 3.5) {
                        e.health--;
                        createExplosion(p.mesh.position);
                        scene.remove(p.mesh);
                        projectiles.splice(pi, 1);

                        e.mesh.children.forEach(child => {
                            if (child.material) {
                                child.material.emissiveIntensity = 2;
                                setTimeout(() => {
                                    if (child.material) child.material.emissiveIntensity = 0.5;
                                }, 100);
                            }
                        });

                        if (e.health <= 0) {
                            e.isDead = true;
                            score += 25;
                        }
                    }
                });
            });

            projectiles.forEach((p, i) => {
                p.mesh.position.add(p.velocity);
                let remove = false;
                for (let b of buildings) {
                    if (new THREE.Box3().setFromObject(b).intersectsBox(new THREE.Box3().setFromObject(p.mesh))) {
                        remove = true;
                        break;
                    }
                }
                if (remove || p.mesh.position.length() > 200) {
                    scene.remove(p.mesh);
                    projectiles.splice(i, 1);
                }
            });

            vehicles.forEach(v => {
                const oldX = v.mesh.position.x;
                v.mesh.position.x += v.speed;
                if (Math.abs(v.mesh.position.x) > 100) v.mesh.position.x = -v.mesh.position.x;
                v.wheels.forEach(w => w.rotation.x += v.speed * 0.5);

                const carBox = new THREE.Box3().setFromObject(v.mesh);
                const playerBox = new THREE.Box3(
                    new THREE.Vector3(player.position.x - 1, player.position.y - 1, player.position.z - 1),
                    new THREE.Vector3(player.position.x + 1, player.position.y + 2, player.position.z + 1)
                );

                if (carBox.intersectsBox(playerBox) && player.position.y < 2.5 && !isInTrain) {
                    health -= 1;
                    const pushDir = new THREE.Vector3().subVectors(player.position, v.mesh.position).normalize();
                    player.position.x += pushDir.x * 2;
                    player.position.z += pushDir.z * 2;

                    v.mesh.children[0].material.emissiveIntensity = 2;
                    setTimeout(() => {
                        if (v.mesh.children[0].material) {
                            v.mesh.children[0].material.emissiveIntensity = 0.5;
                        }
                    }, 100);

                    if (health <= 0) {
                        gameOver = true;
                        document.getElementById('gameOver').style.display = 'block';
                    }
                }
            });

            // Atualizar trem
            if (train) {
                train.mesh.position.x += train.speed;
                if (Math.abs(train.mesh.position.x) > 100) train.mesh.position.x = -train.mesh.position.x;
                train.wheels.forEach(w => w.rotation.x += train.speed * 0.5);

                const trainBox = new THREE.Box3().setFromObject(train.mesh);
                const playerBox = new THREE.Box3(
                    new THREE.Vector3(player.position.x - 1, player.position.y - 1, player.position.z - 1),
                    new THREE.Vector3(player.position.x + 1, player.position.y + 2, player.position.z + 1)
                );

                if (trainBox.intersectsBox(playerBox) && !isInTrain) {
                    isInTrain = true;
                    player.position.copy(train.mesh.position);
                    player.position.y = 2;
                }
            }

            pedestrians.forEach(p => {
                p.walkCycle += 0.1;
                p.mesh.position.x += Math.sin(p.direction) * p.speed;
                p.mesh.position.z += Math.cos(p.direction) * p.speed;
                if (Math.abs(p.mesh.position.x) > 100 || Math.abs(p.mesh.position.z) > 100) {
                    p.direction = Math.random() * Math.PI * 2;
                    const sidewalkIndex = Math.floor(Math.random() * 5);
                    p.mesh.position.x = Math.random() * 80 - 40;
                    p.mesh.position.z = (sidewalkIndex - 2) * 20 + (sidewalkIndex % 2 === 0 ? 7.5 : -7.5);
                }

                if (p.isInteractive && p.mesh.children[2]) {
                    const dist = player.position.distanceTo(p.mesh.position);
                    p.mesh.children[2].visible = dist < 5;
                    if (dist < 5) {
                        p.mesh.children[2].lookAt(camera.position);
                        p.mesh.children[2].position.y = 2 + Math.sin(Date.now() * 0.002) * 0.2;
                    }
                }
            });

            if (safeZone) safeZone.rotation.y += 0.01;

            if (portal) {
                portal.rotation.y += 0.02;
                portal.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
                portal.children.forEach((child, i) => {
                    if (i < portal.children.length - 1) {
                        child.rotation.x += 0.01 * (i + 1);
                    }
                });
            }

            pickups.forEach(p => {
                p.rotation += 0.02;
                p.mesh.rotation.y = p.rotation;
                p.mesh.position.y = 0.5 + Math.sin(p.rotation * 2) * 0.3;
            });

            document.getElementById('health').textContent = Math.max(0, Math.floor(health));
            document.getElementById('stamina').textContent = Math.max(0, Math.floor(stamina));
            document.getElementById('score').textContent = score;
            document.getElementById('level').textContent = level;

            // Atualizar câmera com base no modo
            if (cameraMode === 'first') {
                camera.position.copy(player.position);
                camera.position.y += 1.5;
                camera.rotation.y = player.rotation.y;
                camera.rotation.x = 0;
                camera.rotation.z = 0;
                player.visible = false;
            } else if (cameraMode === 'god') {
                camera.position.set(player.position.x, player.position.y + 20, player.position.z);
                camera.rotation.set(-Math.PI / 2, 0, 0);
                player.visible = true;
            } else {
                const d = 15, h = 8;
                const sway = Math.sin(walkCycle * 0.5) * 0.3;
                camera.position.x = player.position.x + sway;
                camera.position.y = player.position.y + h + Math.sin(walkCycle) * 0.2 + cameraOffset; // Aplicar offset para obstruções
                camera.position.z = player.position.z - d;
                camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
                player.visible = true;
            }

            // Ajustar câmera para obstruções
            if (cameraMode === 'third') {
                adjustCameraForObstructions();
            }

            renderer.autoClear = false;
            renderer.clear();
            renderer.render(scene, camera);
            renderer.autoClear = true;
        }

        // Função de animação principal
        function animate() {
            requestAnimationFrame(animate);
            if (gameStarted) {
                update();
            } else {
                renderer.render(scene, camera);
            }
        }

        // Iniciar o jogo
        document.getElementById('startBtn').addEventListener('click', () => {
            document.getElementById('startScreen').style.display = 'none';
            gameStarted = true;
            setupMobileControls(); // Configurar controles mobile se necessário
            init();
            animate();
        });