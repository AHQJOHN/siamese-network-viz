// --- 1. Scene Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
// Add some fog for depth
scene.fog = new THREE.FogExp2(0x050510, 0.002);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground too much
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 50, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0x00d2ff, 0.5);
pointLight.position.set(0, 20, 0);
scene.add(pointLight);

// --- 2. Geometry Generators ---

// Groups to hold interactive objects
const interactables = [];
const networkGroup = new THREE.Group();
scene.add(networkGroup);

// Material Presets
const matInput = new THREE.MeshPhongMaterial({ color: 0xff5252, transparent: true, opacity: 0.8, shininess: 100 });
const matVGG = new THREE.MeshPhongMaterial({ color: 0x4834d4, transparent: true, opacity: 0.9 });
const matFace = new THREE.MeshPhongMaterial({ color: 0x686de0, transparent: true, opacity: 0.9 });
const matConcat = new THREE.MeshPhongMaterial({ color: 0x22a6b3, wireframe: false });
const matFC = new THREE.MeshPhongMaterial({ color: 0xf0932b });
const matEmb = new THREE.MeshPhongMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 0.2 });
const matLoss = new THREE.MeshPhongMaterial({ color: 0xff7979, wireframe: true });
const matWire = new THREE.LineBasicMaterial({ color: 0x30336b, opacity: 0.3, transparent: true });

// Helper to create a labeled block
function createBlock(name, w, h, d, x, y, z, material, description, details = null) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { name: name, description: description, details: details };
    
    // Add edges
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true }));
    mesh.add(line);

    networkGroup.add(mesh);
    interactables.push(mesh);
    return mesh;
}

// Helper to connect two objects with a line
function connectObjects(obj1, obj2, color = 0x00d2ff) {
    const points = [];
    points.push(obj1.position.clone());
    points.push(obj2.position.clone());
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, opacity: 0.5, transparent: true });
    const line = new THREE.Line(geometry, material);
    networkGroup.add(line);
    return { line, start: obj1.position, end: obj2.position };
}

// --- 3. Build the Network Structure ---

// Siamese Triplets logic: We visualize the Main processing pipeline in the center
// But imply the triplet nature with 3 inputs and outputs.

// --- Stage 1: Inputs ---
const gap = 15;
const inputAnchor = createBlock("Anchor Image (A)", 8, 8, 1, -40, 0, 0, matInput, 
    "Reference image. <br>Goal: Minimize distance to Positive.",
    {
        type: "Input",
        shape: "224 × 224 × 3",
        description: "RGB Face Image",
        preprocessing: "Aligned & Normalized",
        role: "Reference sample in triplet"
    }
);
const inputPos = createBlock("Positive Image (P)", 8, 8, 1, -40, 0, -gap, matInput, 
    "Same class as Anchor. <br>Goal: Pull closer to Anchor.",
    {
        type: "Input",
        shape: "224 × 224 × 3",
        description: "Same Identity as Anchor",
        preprocessing: "Aligned & Normalized",
        role: "Positive pair sample"
    }
);
const inputNeg = createBlock("Negative Image (N)", 8, 8, 1, -40, 0, gap, matInput, 
    "Different class. <br>Goal: Push away from Anchor.",
    {
        type: "Input",
        shape: "224 × 224 × 3",
        description: "Different Identity",
        preprocessing: "Aligned & Normalized",
        role: "Negative pair sample"
    }
);

// --- Stage 2: Feature Extractors (Hybrid) ---
// For visual clarity, we show the branches for the Anchor, and lines for others

// VGGFace Branch
const vggBlock = createBlock("VGGFace Model", 15, 6, 6, -15, 5, 0, matVGG, 
    "Pre-trained VGGFace.<br>Extracts features F_vgg.<br>Fine-tuned last conv layers.",
    {
        type: "CNN Backbone",
        architecture: "VGG-16",
        output_shape: "7 × 7 × 512",
        trainable: "Last 3 conv blocks",
        params: "~138M",
        pretrained: "VGGFace2 Dataset"
    }
);

// FaceNet Branch
const faceBlock = createBlock("FaceNet Model", 15, 6, 6, -15, -5, 0, matFace, 
    "Pre-trained FaceNet.<br>Extracts features F_face.<br>Fine-tuned last conv layers.",
    {
        type: "CNN Backbone",
        architecture: "Inception-ResNet-v1",
        output_shape: "8 × 8 × 1792",
        trainable: "Last inception blocks",
        params: "~23M",
        pretrained: "CASIA-WebFace"
    }
);

// --- Stage 3: Fusion ---
const concatBlock = createBlock("Concatenation & Weighting", 4, 12, 8, 5, 0, 0, matConcat, 
    "Weighted Concatenation:<br><span class='math'>[W_vgg·F_vgg, W_face·F_face]</span>",
    {
        type: "Feature Fusion",
        operation: "Weighted Concat",
        formula: "F = [α·Flatten(F_vgg), β·Flatten(F_face)]",
        vgg_features: "25,088",
        facenet_features: "114,688",
        output_dim: "139,776",
        weights: "Learnable α, β"
    }
);

// --- Stage 4: FC Layers ---
const fc1 = createBlock("FC1 + ReLU", 4, 10, 8, 15, 0, 0, matFC, 
    "Fully Connected Layer 1<br>Non-linearity: ReLU",
    {
        type: "Dense Layer",
        input_dim: "139,776",
        output_dim: "4,096",
        activation: "ReLU",
        dropout: "0.5",
        params: "~572M"
    }
);
const fc2 = createBlock("FC2 + ReLU", 4, 8, 6, 22, 0, 0, matFC, 
    "Fully Connected Layer 2<br>Non-linearity: ReLU",
    {
        type: "Dense Layer",
        input_dim: "4,096",
        output_dim: "2,048",
        activation: "ReLU",
        dropout: "0.5",
        params: "~8.4M"
    }
);
const fc3 = createBlock("FC3 + ReLU", 4, 6, 4, 28, 0, 0, matFC, 
    "Fully Connected Layer 3<br>Non-linearity: ReLU",
    {
        type: "Dense Layer",
        input_dim: "2,048",
        output_dim: "1,024",
        activation: "ReLU",
        dropout: "0.3",
        params: "~2.1M"
    }
);
const fc4 = createBlock("FC4 (Embedding)", 4, 4, 4, 34, 0, 0, matFC, 
    "Final Dense Layer.<br>Output size: <i>d</i>",
    {
        type: "Embedding Layer",
        input_dim: "1,024",
        output_dim: "512",
        activation: "Linear",
        dropout: "0.0",
        params: "~524K"
    }
);

// --- Stage 5: Normalization & Output ---
const normBlock = createBlock("L2 Normalization", 2, 4, 4, 40, 0, 0, matEmb, 
    "Embedding Normalization:<br><span class='math'>E = E / ||E||_2</span><br>Projects to unit hypersphere.",
    {
        type: "Normalization",
        operation: "L2 Normalize",
        formula: "E_norm = E / √(Σ E²)",
        input_dim: "512",
        output_dim: "512",
        constraint: "||E|| = 1",
        space: "Unit Hypersphere"
    }
);

// --- Stage 6: Loss Functions ---
const tripletLossNode = createBlock("Triplet Loss", 6, 6, 6, 55, 10, 0, matLoss, 
    "Optimizes relative distances:<br><span class='math'>max(0, D(A,P) - D(A,N) + alpha)</span>",
    {
        type: "Loss Function",
        formula: "L = max(0, ||E_a - E_p||² - ||E_a - E_n||² + α)",
        margin: "α = 0.2",
        distance: "Euclidean L2",
        goal: "D(A,P) + α < D(A,N)",
        mining: "Semi-hard negatives"
    }
);

const arcFaceLossNode = createBlock("ArcFace Loss", 6, 6, 6, 55, -10, 0, matLoss, 
    "Angular Margin Loss:<br><span class='math'>s * cos(theta + m)</span><br>Improves intra-class compactness.",
    {
        type: "Loss Function",
        formula: "L = -log(e^(s·cos(θ+m)) / Σ)",
        scale: "s = 64",
        margin: "m = 0.5 (radians)",
        distance: "Angular/Cosine",
        goal: "Max inter-class angles",
        advantage: "Better feature separation"
    }
);

// --- Connections ---
const connections = [];

// Connect Inputs to Models (Visualizing Anchor flow primarily, dashed for others implies parallel)
connections.push(connectObjects(inputAnchor, vggBlock));
connections.push(connectObjects(inputAnchor, faceBlock));

// Connect Models to Concat
connections.push(connectObjects(vggBlock, concatBlock));
connections.push(connectObjects(faceBlock, concatBlock));

// Connect Concat -> FC pipeline
connections.push(connectObjects(concatBlock, fc1));
connections.push(connectObjects(fc1, fc2));
connections.push(connectObjects(fc2, fc3));
connections.push(connectObjects(fc3, fc4));
connections.push(connectObjects(fc4, normBlock));

// Connect Norm -> Losses
connections.push(connectObjects(normBlock, tripletLossNode, 0xff7979));
connections.push(connectObjects(normBlock, arcFaceLossNode, 0xff7979));

// Visual lines for P and N bypassing the detailed view (abstracted)
const ghostP = new THREE.Object3D(); ghostP.position.set(40, 0, -gap);
const ghostN = new THREE.Object3D(); ghostN.position.set(40, 0, gap);
scene.add(ghostP); scene.add(ghostN);

const lineP = connectObjects(inputPos, ghostP, 0x555555);
const lineN = connectObjects(inputNeg, ghostN, 0x555555);

// Connect ghost embeddings to Triplet Loss to show dependency
connections.push(connectObjects(ghostP, tripletLossNode, 0xff7979));
connections.push(connectObjects(ghostN, tripletLossNode, 0xff7979));


// --- 4. Particle System (Data Flow Animation) ---
const particles = [];
const particleGeo = new THREE.SphereGeometry(0.3, 8, 8);
const particleMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

function createParticle(pathPoints) {
    const mesh = new THREE.Mesh(particleGeo, particleMat);
    scene.add(mesh);
    particles.push({
        mesh: mesh,
        path: pathPoints,
        currentIdx: 0,
        progress: 0,
        speed: 0.008 + Math.random() * 0.004
    });
}

// Define paths
function spawnParticles() {
    // Path 1: Anchor -> VGG -> Concat -> FCs -> Norm -> TripletLoss
    const pathA_VGG = [
        inputAnchor.position, vggBlock.position, concatBlock.position, 
        fc1.position, fc2.position, fc3.position, fc4.position, 
        normBlock.position, tripletLossNode.position
    ];
    
    // Path 2: Anchor -> FaceNet -> Concat -> ... -> ArcFace
    const pathA_Face = [
        inputAnchor.position, faceBlock.position, concatBlock.position, 
        fc1.position, fc2.position, fc3.position, fc4.position, 
        normBlock.position, arcFaceLossNode.position
    ];

    // Path 3 (simplified): Positive -> Triplet Loss
    const pathP = [inputPos.position, ghostP.position, tripletLossNode.position];

    // Path 4 (simplified): Negative -> Triplet Loss
    const pathN = [inputNeg.position, ghostN.position, tripletLossNode.position];

    if(Math.random() > 0.5) createParticle(pathA_VGG);
    if(Math.random() > 0.5) createParticle(pathA_Face);
    if(Math.random() > 0.7) createParticle(pathP);
    if(Math.random() > 0.7) createParticle(pathN);
}

setInterval(spawnParticles, 500);

// --- 5. Component Detail Display System ---
const detailsPanel = document.getElementById('component-details');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');
let currentDisplayedComponent = null;
let detailTimeout = null;

function showComponentDetails(component) {
    if (!component.userData.details) return;
    
    currentDisplayedComponent = component;
    const details = component.userData.details;
    
    detailTitle.textContent = component.userData.name;
    
    let html = '';
    for (let [key, value] of Object.entries(details)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        html += `
            <div class="detail-row">
                <span class="detail-label">${label}:</span>
                <span class="detail-value">${value}</span>
            </div>
        `;
    }
    
    detailContent.innerHTML = html;
    detailsPanel.style.display = 'block';
    
    // Auto-hide after 8 seconds
    clearTimeout(detailTimeout);
    detailTimeout = setTimeout(() => {
        detailsPanel.style.display = 'none';
        currentDisplayedComponent = null;
    }, 8000);
}

function highlightComponent(component, duration = 800) {
    const originalColor = component.material.color.getHex();
    const originalEmissive = component.material.emissive.getHex();
    
    // Flash effect
    component.material.emissive.setHex(0xffffff);
    component.material.emissiveIntensity = 0.5;
    
    setTimeout(() => {
        component.material.emissive.setHex(originalEmissive);
        component.material.emissiveIntensity = 0.2;
    }, duration);
}

// Track which components particles are currently at
function checkParticleProximity(particlePos) {
    const threshold = 3.5;
    for (let obj of interactables) {
        const dist = particlePos.distanceTo(obj.position);
        if (dist < threshold && obj !== currentDisplayedComponent) {
            showComponentDetails(obj);
            highlightComponent(obj, 1500);
            break;
        }
    }
}

// --- 6. Interaction Logic ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
const ttTitle = document.getElementById('tt-title');
const ttDesc = document.getElementById('tt-desc');

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    tooltip.style.left = event.clientX + 15 + 'px';
    tooltip.style.top = event.clientY + 15 + 'px';
}

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Grid helper floor
const gridHelper = new THREE.GridHelper(200, 50, 0x1a1a2e, 0x0f0f1a);
gridHelper.position.y = -20;
scene.add(gridHelper);

document.getElementById('loading').style.display = 'none';

// --- 7. Animation Loop ---
let frameCount = 0;
function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    controls.update();

    // Hover effects
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        obj.material.emissive.setHex(0x555555);
        
        tooltip.style.display = 'block';
        ttTitle.innerText = obj.userData.name;
        ttDesc.innerHTML = obj.userData.description;
        document.body.style.cursor = 'pointer';
    } else {
        interactables.forEach(obj => {
            if(obj.userData.name === "L2 Normalization") return; 
            obj.material.emissive.setHex(0x000000);
        });
        normBlock.material.emissive.setHex(0x2ecc71); 
        
        tooltip.style.display = 'none';
        document.body.style.cursor = 'default';
    }

    // Animate Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        
        if (p.currentIdx >= p.path.length - 1) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
            continue;
        }

        const start = p.path[p.currentIdx];
        const end = p.path[p.currentIdx + 1];

        if (p.progress >= 1) {
            p.currentIdx++;
            p.progress = 0;
            if (p.currentIdx >= p.path.length - 1) {
                scene.remove(p.mesh);
                particles.splice(i, 1);
                continue;
            }
            p.mesh.position.copy(p.path[p.currentIdx]);
        } else {
            p.mesh.position.lerpVectors(start, end, p.progress);
        }
        
        // Check proximity to components
        if (frameCount % 3 === 0) {
            checkParticleProximity(p.mesh.position);
        }
    }

    // Gentle float for loss nodes
    const time = Date.now() * 0.001;
    tripletLossNode.position.y = 10 + Math.sin(time) * 1;
    arcFaceLossNode.position.y = -10 + Math.cos(time) * 1;
    
    // Rotate Embeddings slightly
    normBlock.rotation.y += 0.01;
    normBlock.rotation.z += 0.005;

    renderer.render(scene, camera);
}

animate();
