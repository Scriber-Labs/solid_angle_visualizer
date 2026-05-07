let scene, camera, renderer, controls;
let sphere, solidAngleMesh, differentialBandMesh;
// Mode 1 (Solid Angle) labels and lines
let theta1Line, theta2Line, phi1Line, phi2Line;
let theta1Label, theta2Label, phi1Label, phi2Label;
// Mode 2 (Differential) labels and lines
let diffTheta1Line, diffTheta2Line, deltaThetaLabel, deltaOmegaFormulaLabel;
// Coordinate axes
let xAxis, yAxis, zAxis, xAxisLabel, yAxisLabel, zAxisLabel;
let currentMode = 'solid-angle';

const params = {
    solidAngle: {
        thetaStart: 0,
        thetaEnd: Math.PI / 4,
        phiStart: 0,
        phiEnd: 2 * Math.PI
    },
    differential: {
        theta: Math.PI / 4,
        dtheta: Math.PI / 20
    }
};

function init() {
    const container = document.getElementById('three-canvas');

    scene = new THREE.Scene();
    scene.background = null; // Transparent background

    camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(2.5, 2.5, 2.5);
    camera.lookAt(0, 0, 0);

    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
        console.warn('WebGL not available, using Canvas fallback');
        const fallbackDiv = document.createElement('div');
        fallbackDiv.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-family: Aclonica, sans-serif; text-align: center; padding: 20px;';
        fallbackDiv.innerHTML = '<div><p style="font-size: 1.2rem; margin-bottom: 10px;">3D Visualization</p><p>WebGL is not available in this environment.<br>The application controls and calculations are fully functional.</p></div>';
        container.appendChild(fallbackDiv);

        setupEventListeners();
        updateVisualization();
        return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    initOrbitControls();

    createLighting();
    createBaseSphere();
    createSolidAngleRegion();
    createDifferentialBand();
    createAngleLabels();

    setupEventListeners();

    updateVisualization();

    animate();
}

function initOrbitControls() {
    controls = {
        mouseDown: false,
        mouseButton: 0,
        mouseX: 0,
        mouseY: 0,
        rotationX: 0,
        rotationY: 0,
        zoom: 2.5
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
}

function onMouseDown(event) {
    if (!controls) return;
    controls.mouseDown = true;
    controls.mouseButton = event.button;
    controls.mouseX = event.clientX;
    controls.mouseY = event.clientY;
}

function onMouseMove(event) {
    if (!controls || !controls.mouseDown) return;

    const deltaX = event.clientX - controls.mouseX;
    const deltaY = event.clientY - controls.mouseY;

    if (controls.mouseButton === 0) {
        controls.rotationY += deltaX * 0.005;
        controls.rotationX += deltaY * 0.005;
        controls.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, controls.rotationX));
    }

    controls.mouseX = event.clientX;
    controls.mouseY = event.clientY;

    updateCameraPosition();
}

function onMouseUp() {
    if (controls) controls.mouseDown = false;
}

function onWheel(event) {
    if (!controls) return;
    event.preventDefault();
    controls.zoom += event.deltaY * 0.001;
    controls.zoom = Math.max(1.5, Math.min(5, controls.zoom));
    updateCameraPosition();
}

function updateCameraPosition() {
    if (!camera || !controls) return;
    const radius = controls.zoom;
    camera.position.x = radius * Math.cos(controls.rotationX) * Math.sin(controls.rotationY);
    camera.position.y = radius * Math.sin(controls.rotationX);
    camera.position.z = radius * Math.cos(controls.rotationX) * Math.cos(controls.rotationY);
    camera.lookAt(0, 0, 0);
}

function createLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);
}

function createBaseSphere() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Create purple-magenta-orange gradient using vertex colors
    const colors = [];
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);
        const t = (y + 1) / 2; // Normalize to 0-1

        // Purple to Magenta to Orange gradient
        let r, g, b;
        if (t < 0.5) {
            // Purple (0.6, 0.2, 0.8) to Magenta (1.0, 0.0, 1.0)
            const t2 = t * 2;
            r = 0.6 + (1.0 - 0.6) * t2;
            g = 0.2 + (0.0 - 0.2) * t2;
            b = 0.8 + (1.0 - 0.8) * t2;
        } else {
            // Magenta (1.0, 0.0, 1.0) to Orange (1.0, 0.5, 0.0)
            const t2 = (t - 0.5) * 2;
            r = 1.0;
            g = 0.0 + 0.5 * t2;
            b = 1.0 + (0.0 - 1.0) * t2;
        }

        colors.push(r, g, b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        shininess: 100
    });

    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}

function createSolidAngleRegion() {
    solidAngleMesh = new THREE.Group();
    scene.add(solidAngleMesh);
}

function createDifferentialBand() {
    differentialBandMesh = new THREE.Group();
    scene.add(differentialBandMesh);
}

function createAngleLabels() {
    // Create coordinate axes
    createCoordinateAxes();

    // === MODE 1: Solid Angle Lines and Labels ===
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00e8ff, linewidth: 2 });

    // Theta1 line (meridian at thetaStart)
    theta1Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    scene.add(theta1Line);
    theta1Label = createTextSprite('θ₁', { r: 0, g: 232, b: 255, a: 1.0 });
    theta1Label.scale.set(0.4, 0.4, 1);
    scene.add(theta1Label);

    // Theta2 line (meridian at thetaEnd)
    theta2Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    scene.add(theta2Line);
    theta2Label = createTextSprite('θ₂', { r: 0, g: 232, b: 255, a: 1.0 });
    theta2Label.scale.set(0.4, 0.4, 1);
    scene.add(theta2Label);

    // Phi1 line (radial line at phiStart)
    phi1Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    scene.add(phi1Line);
    phi1Label = createTextSprite('φ₁', { r: 20, g: 181, b: 255, a: 1.0 });
    phi1Label.scale.set(0.4, 0.4, 1);
    scene.add(phi1Label);

    // Phi2 line (radial line at phiEnd)
    phi2Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    scene.add(phi2Line);
    phi2Label = createTextSprite('φ₂', { r: 20, g: 181, b: 255, a: 1.0 });
    phi2Label.scale.set(0.4, 0.4, 1);
    scene.add(phi2Label);

    // === MODE 2: Differential Lines and Labels ===
    diffTheta1Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    diffTheta1Line.visible = false;
    scene.add(diffTheta1Line);

    diffTheta2Line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial.clone());
    diffTheta2Line.visible = false;
    scene.add(diffTheta2Line);

    deltaThetaLabel = createTextSprite('dθ', { r: 0, g: 232, b: 255, a: 1.0 });
    deltaThetaLabel.scale.set(0.4, 0.4, 1);
    deltaThetaLabel.visible = false;
    scene.add(deltaThetaLabel);

    deltaOmegaFormulaLabel = createTextSprite('sin(θ)', { r: 0, g: 232, b: 255, a: 1.0 });
    deltaOmegaFormulaLabel.scale.set(0.4, 0.4, 1);
    deltaOmegaFormulaLabel.visible = false;
    scene.add(deltaOmegaFormulaLabel);
}

function createCoordinateAxes() {
    const axisLength = 1.5;
    const axisColor = 0xffffff;
    const axisOpacity = 0.4;
    const axisMaterial = new THREE.LineBasicMaterial({
        color: axisColor,
        transparent: true,
        opacity: axisOpacity,
        linewidth: 1
    });

    // X-axis (red tint)
    const xPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)];
    xAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(xPoints),
        new THREE.LineBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.5 })
    );
    scene.add(xAxis);
    xAxisLabel = createTextSprite('x', { r: 255, g: 102, b: 102, a: 0.8 });
    xAxisLabel.scale.set(0.3, 0.3, 1);
    xAxisLabel.position.set(axisLength + 0.2, 0, 0);
    scene.add(xAxisLabel);

    // Y-axis (green tint)
    const yPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)];
    yAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(yPoints),
        new THREE.LineBasicMaterial({ color: 0x66ff66, transparent: true, opacity: 0.5 })
    );
    scene.add(yAxis);
    yAxisLabel = createTextSprite('y', { r: 102, g: 255, b: 102, a: 0.8 });
    yAxisLabel.scale.set(0.3, 0.3, 1);
    yAxisLabel.position.set(0, axisLength + 0.2, 0);
    scene.add(yAxisLabel);

    // Z-axis (blue tint)
    const zPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)];
    zAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(zPoints),
        new THREE.LineBasicMaterial({ color: 0x6666ff, transparent: true, opacity: 0.5 })
    );
    scene.add(zAxis);
    zAxisLabel = createTextSprite('z', { r: 102, g: 102, b: 255, a: 0.8 });
    zAxisLabel.scale.set(0.3, 0.3, 1);
    zAxisLabel.position.set(0, 0, axisLength + 0.2);
    scene.add(zAxisLabel);
}

function createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;

    context.font = 'Bold 80px Aclonica, sans-serif';
    context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.5, 1);

    return sprite;
}

function updateSolidAngleVisualization() {
    if (!solidAngleMesh) return;

    while (solidAngleMesh.children.length > 0) {
        const child = solidAngleMesh.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
        solidAngleMesh.remove(child);
    }

    const thetaStart = params.solidAngle.thetaStart;
    const thetaEnd = params.solidAngle.thetaEnd;
    const phiStart = params.solidAngle.phiStart;
    const phiEnd = params.solidAngle.phiEnd;

    const thetaSegments = 50;
    const phiSegments = 50;

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];

    for (let i = 0; i <= thetaSegments; i++) {
        const theta = thetaStart + (thetaEnd - thetaStart) * (i / thetaSegments);
        for (let j = 0; j <= phiSegments; j++) {
            const phi = phiStart + (phiEnd - phiStart) * (j / phiSegments);

            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.sin(theta) * Math.sin(phi);
            const z = Math.cos(theta);

            vertices.push(x, y, z);

            // Cyan to Blue gradient matching button (#00e8ff to #0070eb)
            const t = i / thetaSegments;
            const r = 0.0; // Both colors have r=0
            const g = 0.91 + (0.44 - 0.91) * t; // 232/255 to 112/255
            const b = 1.0 + (0.92 - 1.0) * t; // 255/255 to 235/255
            colors.push(r, g, b);
        }
    }

    for (let i = 0; i < thetaSegments; i++) {
        for (let j = 0; j < phiSegments; j++) {
            const a = i * (phiSegments + 1) + j;
            const b = a + phiSegments + 1;
            const c = a + 1;
            const d = b + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: false,
        opacity: 1.0,
        side: THREE.DoubleSide,
        shininess: 80
    });

    const mesh = new THREE.Mesh(geometry, material);
    solidAngleMesh.add(mesh);

    // Update Mode 1 lines and labels
    updateSolidAngleLabels(thetaStart, thetaEnd, phiStart, phiEnd);

    // Show Mode 1 labels, hide Mode 2 labels
    if (theta1Line) theta1Line.visible = true;
    if (theta2Line) theta2Line.visible = true;
    if (phi1Line) phi1Line.visible = true;
    if (phi2Line) phi2Line.visible = true;
    if (theta1Label) theta1Label.visible = true;
    if (theta2Label) theta2Label.visible = true;
    if (phi1Label) phi1Label.visible = true;
    if (phi2Label) phi2Label.visible = true;
    if (diffTheta1Line) diffTheta1Line.visible = false;
    if (diffTheta2Line) diffTheta2Line.visible = false;
    if (deltaThetaLabel) deltaThetaLabel.visible = false;
    if (deltaOmegaFormulaLabel) deltaOmegaFormulaLabel.visible = false;
}

function updateDifferentialVisualization() {
    if (!differentialBandMesh) return;

    while (differentialBandMesh.children.length > 0) {
        const child = differentialBandMesh.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
            } else {
                child.material.dispose();
            }
        }
        differentialBandMesh.remove(child);
    }

    const theta = params.differential.theta;
    const dtheta = params.differential.dtheta;
    const thetaStart = theta - dtheta / 2;
    const thetaEnd = theta + dtheta / 2;

    const thetaSegments = 30;
    const phiSegments = 80;

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];

    for (let i = 0; i <= thetaSegments; i++) {
        const t = thetaStart + (thetaEnd - thetaStart) * (i / thetaSegments);
        for (let j = 0; j <= phiSegments; j++) {
            const phi = 2 * Math.PI * (j / phiSegments);

            const x = Math.sin(t) * Math.cos(phi);
            const y = Math.sin(t) * Math.sin(phi);
            const z = Math.cos(t);

            vertices.push(x, y, z);

            // Cyan to Blue gradient matching button (#00e8ff to #0070eb)
            const progress = i / thetaSegments;
            const r = 0.0; // Both colors have r=0
            const g = 0.91 + (0.44 - 0.91) * progress; // 232/255 to 112/255
            const b = 1.0 + (0.92 - 1.0) * progress; // 255/255 to 235/255
            colors.push(r, g, b);
        }
    }

    for (let i = 0; i < thetaSegments; i++) {
        for (let j = 0; j < phiSegments; j++) {
            const a = i * (phiSegments + 1) + j;
            const b = a + phiSegments + 1;
            const c = a + 1;
            const d = b + 1;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: false,
        opacity: 1.0,
        side: THREE.DoubleSide,
        shininess: 80
    });

    const mesh = new THREE.Mesh(geometry, material);
    differentialBandMesh.add(mesh);

    // Hide Mode 1 labels, show Mode 2 labels
    if (theta1Line) theta1Line.visible = false;
    if (theta2Line) theta2Line.visible = false;
    if (phi1Line) phi1Line.visible = false;
    if (phi2Line) phi2Line.visible = false;
    if (theta1Label) theta1Label.visible = false;
    if (theta2Label) theta2Label.visible = false;
    if (phi1Label) phi1Label.visible = false;
    if (phi2Label) phi2Label.visible = false;
    if (diffTheta1Line) diffTheta1Line.visible = true;
    if (diffTheta2Line) diffTheta2Line.visible = true;
    if (deltaThetaLabel) deltaThetaLabel.visible = true;
    if (deltaOmegaFormulaLabel) deltaOmegaFormulaLabel.visible = true;

    // Update differential boundary lines (circles at theta1 and theta2)
    if (!diffTheta1Line || !diffTheta2Line || !deltaThetaLabel || !deltaOmegaFormulaLabel) return;

    const circlePoints1 = [];
    const circlePoints2 = [];
    for (let i = 0; i <= 64; i++) {
        const phi = (2 * Math.PI / 64) * i;

        // Top boundary line (theta1)
        const x1 = Math.sin(thetaStart) * Math.cos(phi);
        const y1 = Math.sin(thetaStart) * Math.sin(phi);
        const z1 = Math.cos(thetaStart);
        circlePoints1.push(new THREE.Vector3(x1, y1, z1));

        // Bottom boundary line (theta2)
        const x2 = Math.sin(thetaEnd) * Math.cos(phi);
        const y2 = Math.sin(thetaEnd) * Math.sin(phi);
        const z2 = Math.cos(thetaEnd);
        circlePoints2.push(new THREE.Vector3(x2, y2, z2));
    }

    diffTheta1Line.geometry.setFromPoints(circlePoints1);
    diffTheta2Line.geometry.setFromPoints(circlePoints2);

    // Position dθ label between the two circles
    const labelTheta = theta;
    const labelPhi = Math.PI / 2; // Position on side
    deltaThetaLabel.position.set(
        Math.sin(labelTheta) * Math.cos(labelPhi) * 1.35,
        Math.sin(labelTheta) * Math.sin(labelPhi) * 1.35,
        Math.cos(labelTheta) * 1.35
    );

    // Position sin(θ) label (showing the radius of the ring)
    const formulaPhi = 0;
    deltaOmegaFormulaLabel.position.set(
        Math.sin(labelTheta) * Math.cos(formulaPhi) * 1.1,
        Math.sin(labelTheta) * Math.sin(formulaPhi) * 1.1,
        Math.cos(labelTheta) * 1.1
    );
}

function updateSolidAngleLabels(thetaStart, thetaEnd, phiStart, phiEnd) {
    if (!theta1Line || !theta2Line || !phi1Line || !phi2Line || 
        !theta1Label || !theta2Label || !phi1Label || !phi2Label) return;

    const midPhi = (phiStart + phiEnd) / 2;
    const midTheta = (thetaStart + thetaEnd) / 2;

    // Theta1 line - latitude circle at thetaStart (constant θ, vary φ)
    const theta1Points = [];
    for (let i = 0; i <= 50; i++) {
        const phi = phiStart + (phiEnd - phiStart) * (i / 50);
        const x = Math.sin(thetaStart) * Math.cos(phi);
        const y = Math.sin(thetaStart) * Math.sin(phi);
        const z = Math.cos(thetaStart);
        theta1Points.push(new THREE.Vector3(x, y, z));
    }
    theta1Line.geometry.setFromPoints(theta1Points);
    theta1Label.position.set(
        Math.sin(thetaStart) * Math.cos(midPhi) * 1.3,
        Math.sin(thetaStart) * Math.sin(midPhi) * 1.3,
        Math.cos(thetaStart) * 1.3
    );

    // Theta2 line - latitude circle at thetaEnd (constant θ, vary φ)
    const theta2Points = [];
    for (let i = 0; i <= 50; i++) {
        const phi = phiStart + (phiEnd - phiStart) * (i / 50);
        const x = Math.sin(thetaEnd) * Math.cos(phi);
        const y = Math.sin(thetaEnd) * Math.sin(phi);
        const z = Math.cos(thetaEnd);
        theta2Points.push(new THREE.Vector3(x, y, z));
    }
    theta2Line.geometry.setFromPoints(theta2Points);
    theta2Label.position.set(
        Math.sin(thetaEnd) * Math.cos(midPhi) * 1.3,
        Math.sin(thetaEnd) * Math.sin(midPhi) * 1.3,
        Math.cos(thetaEnd) * 1.3
    );

    // Phi1 line - meridian arc at phiStart (constant φ, vary θ)
    const phi1Points = [];
    for (let i = 0; i <= 50; i++) {
        const theta = thetaStart + (thetaEnd - thetaStart) * (i / 50);
        const x = Math.sin(theta) * Math.cos(phiStart);
        const y = Math.sin(theta) * Math.sin(phiStart);
        const z = Math.cos(theta);
        phi1Points.push(new THREE.Vector3(x, y, z));
    }
    phi1Line.geometry.setFromPoints(phi1Points);
    phi1Label.position.set(
        Math.sin(midTheta) * Math.cos(phiStart) * 1.3,
        Math.sin(midTheta) * Math.sin(phiStart) * 1.3,
        Math.cos(midTheta) * 1.3
    );

    // Phi2 line - meridian arc at phiEnd (constant φ, vary θ)
    const phi2Points = [];
    for (let i = 0; i <= 50; i++) {
        const theta = thetaStart + (thetaEnd - thetaStart) * (i / 50);
        const x = Math.sin(theta) * Math.cos(phiEnd);
        const y = Math.sin(theta) * Math.sin(phiEnd);
        const z = Math.cos(theta);
        phi2Points.push(new THREE.Vector3(x, y, z));
    }
    phi2Line.geometry.setFromPoints(phi2Points);
    phi2Label.position.set(
        Math.sin(midTheta) * Math.cos(phiEnd) * 1.3,
        Math.sin(midTheta) * Math.sin(phiEnd) * 1.3,
        Math.cos(midTheta) * 1.3
    );
}

function setupEventListeners() {
    document.getElementById('mode-solid-angle').addEventListener('click', () => {
        switchMode('solid-angle');
    });

    document.getElementById('mode-differential').addEventListener('click', () => {
        switchMode('differential');
    });

    document.getElementById('theta-start').addEventListener('input', (e) => {
        params.solidAngle.thetaStart = parseFloat(e.target.value);
        document.getElementById('theta-start-value').textContent = parseFloat(e.target.value).toFixed(2);
        updateVisualization();
    });

    document.getElementById('theta-end').addEventListener('input', (e) => {
        params.solidAngle.thetaEnd = parseFloat(e.target.value);
        document.getElementById('theta-end-value').textContent = parseFloat(e.target.value).toFixed(2);
        updateVisualization();
    });

    document.getElementById('phi-start').addEventListener('input', (e) => {
        params.solidAngle.phiStart = parseFloat(e.target.value);
        document.getElementById('phi-start-value').textContent = parseFloat(e.target.value).toFixed(2);
        updateVisualization();
    });

    document.getElementById('phi-end').addEventListener('input', (e) => {
        params.solidAngle.phiEnd = parseFloat(e.target.value);
        document.getElementById('phi-end-value').textContent = parseFloat(e.target.value).toFixed(2);
        updateVisualization();
    });

    document.getElementById('theta-diff').addEventListener('input', (e) => {
        params.differential.theta = parseFloat(e.target.value);
        document.getElementById('theta-diff-value').textContent = parseFloat(e.target.value).toFixed(2);
        updateVisualization();
    });

    document.getElementById('dtheta').addEventListener('input', (e) => {
        params.differential.dtheta = parseFloat(e.target.value);
        document.getElementById('dtheta-value').textContent = parseFloat(e.target.value).toFixed(2);
        updateVisualization();
    });

    window.addEventListener('resize', onWindowResize);
}

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));

    if (mode === 'solid-angle') {
        const modeSolidAngleBtn = document.getElementById('mode-solid-angle');
        if (modeSolidAngleBtn) modeSolidAngleBtn.classList.add('active');
        
        const solidAngleControls = document.getElementById('solid-angle-controls');
        if (solidAngleControls) solidAngleControls.classList.remove('hidden');
        
        const differentialControls = document.getElementById('differential-controls');
        if (differentialControls) differentialControls.classList.add('hidden');
        
        const sinThetaDisplay = document.getElementById('sin-theta-display');
        if (sinThetaDisplay) sinThetaDisplay.classList.add('hidden');
        
        const explanationSection = document.getElementById('explanation-section');
        if (explanationSection) explanationSection.classList.remove('hidden');
        
        const sinThetaSection = document.getElementById('sin-theta-section');
        if (sinThetaSection) sinThetaSection.classList.add('hidden');
        
        if (solidAngleMesh) solidAngleMesh.visible = true;
        if (differentialBandMesh) differentialBandMesh.visible = false;
    } else {
        const modeDifferentialBtn = document.getElementById('mode-differential');
        if (modeDifferentialBtn) modeDifferentialBtn.classList.add('active');
        
        const solidAngleControls = document.getElementById('solid-angle-controls');
        if (solidAngleControls) solidAngleControls.classList.add('hidden');
        
        const differentialControls = document.getElementById('differential-controls');
        if (differentialControls) differentialControls.classList.remove('hidden');
        
        const sinThetaDisplay = document.getElementById('sin-theta-display');
        if (sinThetaDisplay) sinThetaDisplay.classList.remove('hidden');
        
        const explanationSection = document.getElementById('explanation-section');
        if (explanationSection) explanationSection.classList.add('hidden');
        
        const sinThetaSection = document.getElementById('sin-theta-section');
        if (sinThetaSection) sinThetaSection.classList.remove('hidden');
        
        if (solidAngleMesh) solidAngleMesh.visible = false;
        if (differentialBandMesh) differentialBandMesh.visible = true;
    }

    updateVisualization();
}

async function updateVisualization() {
    if (currentMode === 'solid-angle') {
        if (solidAngleMesh) {
            updateSolidAngleVisualization();
        }
        await calculateSolidAngle();
    } else {
        if (differentialBandMesh) {
            updateDifferentialVisualization();
        }
        await calculateDifferential();
    }
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
    }
}

async function calculateSolidAngle() {
    try {
        const payload = {
            theta_start: params.solidAngle.thetaStart,
            theta_end: params.solidAngle.thetaEnd,
            phi_start: params.solidAngle.phiStart,
            phi_end: params.solidAngle.phiEnd
        };

        const response = await fetch('/api/calculate_solid_angle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        const solidAngleRes = document.getElementById('solid-angle-result');
        if (solidAngleRes) solidAngleRes.textContent = `${data.solid_angle.toFixed(3)} sr`;
        
        const surfaceAreaRes = document.getElementById('surface-area-result');
        if (surfaceAreaRes) surfaceAreaRes.textContent = `${data.surface_area.toFixed(3)} units²`;

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
    } catch (error) {
        console.error('Error calculating solid angle:', error);
    }
}

async function calculateDifferential() {
    try {
        const response = await fetch('/api/calculate_differential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params.differential)
        });

        const data = await response.json();

        const solidAngleRes = document.getElementById('solid-angle-result');
        if (solidAngleRes) solidAngleRes.textContent = `${data.differential_solid_angle.toFixed(3)} sr`;
        
        const surfaceAreaRes = document.getElementById('surface-area-result');
        if (surfaceAreaRes) surfaceAreaRes.textContent = `${data.surface_area.toFixed(3)} units²`;
        
        const sinThetaRes = document.getElementById('sin-theta-result');
        if (sinThetaRes) sinThetaRes.textContent = `${data.sin_theta.toFixed(3)}`;

        updateSinThetaGraph(data.theta, data.sin_theta);

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
    } catch (error) {
        console.error('Error calculating differential:', error);
    }
}

function updateSinThetaGraph(theta, sinTheta) {
    const graphContainer = document.getElementById('sin-theta-graph');
    graphContainer.innerHTML = '';

    const width = graphContainer.clientWidth || 300;
    const height = 200;
    const padding = 40;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.background = 'rgba(0, 0, 0, 0.3)';

    const points = [];
    for (let i = 0; i <= 100; i++) {
        const t = (Math.PI / 100) * i;
        const x = padding + (width - 2 * padding) * (t / Math.PI);
        const y = height - padding - (height - 2 * padding) * Math.sin(t);
        points.push(`${x},${y}`);
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', points.join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#00e8ff');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);

    const currentX = padding + (width - 2 * padding) * (theta / Math.PI);
    const currentY = height - padding - (height - 2 * padding) * sinTheta;

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('cx', currentX);
    marker.setAttribute('cy', currentY);
    marker.setAttribute('r', '5');
    marker.setAttribute('fill', '#14b5ff');
    svg.appendChild(marker);

    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', padding);
    xAxis.setAttribute('y1', height - padding);
    xAxis.setAttribute('x2', width - padding);
    xAxis.setAttribute('y2', height - padding);
    xAxis.setAttribute('stroke', 'white');
    xAxis.setAttribute('stroke-width', '1');
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', padding);
    yAxis.setAttribute('y1', padding);
    yAxis.setAttribute('x2', padding);
    yAxis.setAttribute('y2', height - padding);
    yAxis.setAttribute('stroke', 'white');
    yAxis.setAttribute('stroke-width', '1');
    svg.appendChild(yAxis);

    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', height - 10);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('fill', 'white');
    xLabel.setAttribute('font-size', '12');
    xLabel.setAttribute('font-family', 'Aclonica, sans-serif');
    xLabel.textContent = 'θ (radians)';
    svg.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', 10);
    yLabel.setAttribute('y', height / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('fill', 'white');
    yLabel.setAttribute('font-size', '12');
    yLabel.setAttribute('font-family', 'Aclonica, sans-serif');
    yLabel.setAttribute('transform', `rotate(-90, 10, ${height / 2})`);
    yLabel.textContent = 'sin(θ)';
    svg.appendChild(yLabel);

    // Add Y-axis tick mark for maximum value (sin(θ) = 1.0)
    const maxY = padding; // Top of the graph (sin = 1)
    const maxTickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    maxTickLine.setAttribute('x1', padding - 5);
    maxTickLine.setAttribute('y1', maxY);
    maxTickLine.setAttribute('x2', padding + 5);
    maxTickLine.setAttribute('y2', maxY);
    maxTickLine.setAttribute('stroke', 'white');
    maxTickLine.setAttribute('stroke-width', '2');
    svg.appendChild(maxTickLine);

    const maxTickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maxTickLabel.setAttribute('x', padding - 10);
    maxTickLabel.setAttribute('y', maxY + 4);
    maxTickLabel.setAttribute('text-anchor', 'end');
    maxTickLabel.setAttribute('fill', 'white');
    maxTickLabel.setAttribute('font-size', '10');
    maxTickLabel.setAttribute('font-family', 'Aclonica, sans-serif');
    maxTickLabel.textContent = '1.0';
    svg.appendChild(maxTickLabel);

    // Add X-axis tick marks at intervals of π/8
    for (let i = 0; i <= 8; i++) {
        const thetaValue = (Math.PI / 8) * i;
        const tickX = padding + (width - 2 * padding) * (thetaValue / Math.PI);

        // Draw tick mark
        const tickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tickLine.setAttribute('x1', tickX);
        tickLine.setAttribute('y1', height - padding - 5);
        tickLine.setAttribute('x2', tickX);
        tickLine.setAttribute('y2', height - padding + 5);
        tickLine.setAttribute('stroke', 'white');
        tickLine.setAttribute('stroke-width', '2');
        svg.appendChild(tickLine);

        // Add tick label
        const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tickLabel.setAttribute('x', tickX);
        tickLabel.setAttribute('y', height - padding + 18);
        tickLabel.setAttribute('text-anchor', 'middle');
        tickLabel.setAttribute('fill', 'white');
        tickLabel.setAttribute('font-size', '9');
        tickLabel.setAttribute('font-family', 'Aclonica, sans-serif');

        // Format label as fractions of π
        if (i === 0) {
            tickLabel.textContent = '0';
        } else if (i === 8) {
            tickLabel.textContent = 'π';
        } else {
            tickLabel.textContent = `${i}π/8`;
        }
        svg.appendChild(tickLabel);
    }

    graphContainer.appendChild(svg);
}

function onWindowResize() {
    const container = document.getElementById('three-canvas');
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (renderer && renderer.render) {
        renderer.render(scene, camera);
    }
}

window.addEventListener('DOMContentLoaded', init);
