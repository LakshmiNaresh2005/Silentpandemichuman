// 3D Liver Rendering logic using Three.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('liver-3d-container');
    const canvas = document.getElementById('liver-canvas');

    if (!container || !canvas || typeof THREE === 'undefined') {
        console.error('Three.js or container not found for 3D Liver');
        return;
    }

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });

    const width = container.clientWidth;
    const height = container.clientHeight || 300;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;
    camera.position.x = 0;

    // Lighting (Medical/Studio Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xcceeff, 0.5);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x00e5ff, 1.5, 10);
    rimLight.position.set(0, -3, -5);
    scene.add(rimLight);

    // Group to hold our liver (either procedural or loaded GLTF)
    const liverGroup = new THREE.Group();
    scene.add(liverGroup);

    // Dynamic Materials (can be applied to procedurally generated or loaded models)
    const biologicalMaterial = new THREE.MeshStandardMaterial({
        color: 0x6e1b1b, // deep hepatic red/brown
        roughness: 0.35,
        metalness: 0.1,
        emissive: 0x1a0505,
    });

    const techWireframe = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });

    // 2. Procedural Anatomical Liver Generator (Fallback)
    function createProceduralLiver() {
        const geometry = new THREE.SphereGeometry(1, 128, 128);
        const pos = geometry.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            let x = v.x * 1.6; // Width
            let y = v.y;       // Height
            let z = v.z;       // Depth

            // Calculate thickness (0 left lobe edge, 1 right lobe edge)
            let thickness = (x + 1.6) / 3.2;

            // Diaphragmatic (superior) surface is convex and smooth
            if (y > 0) {
                y *= (0.6 + 0.4 * Math.sin(thickness * Math.PI * 0.5));
            } else {
                // Visceral (inferior) surface is flatter and irregular
                y *= (0.2 + 0.2 * thickness);

                // Gallbladder fossa (depression on the right inferior side)
                let gbDist = Math.sqrt(Math.pow(x - 0.6, 2) + Math.pow(z - 0.4, 2));
                if (gbDist < 0.5) {
                    y += (0.5 - gbDist) * 0.4;
                }

                // Porta hepatis (central depression)
                let phDist = Math.sqrt(Math.pow(x - 0.0, 2) + Math.pow(z + 0.2, 2));
                if (phDist < 0.4) {
                    y += (0.4 - phDist) * 0.5;
                }
            }

            // Depth taper towards the left lobe
            z *= (0.3 + 0.7 * Math.pow(thickness, 0.8));

            // Sharp inferior border anteriorly
            if (y < 0 && z > 0) {
                let edge = Math.abs(z * 0.5 - Math.abs(y));
                if (edge < 0.2) {
                    z += 0.15 * thickness; // Pull edge forward
                    y -= 0.05;
                }
            }

            // Renal impression curvature (posterior right)
            if (z < 0 && x > 0.3) {
                z += Math.sin((x - 0.3) * Math.PI) * 0.15;
            }

            // Add slight organic noise
            const noise = (Math.random() - 0.5) * 0.015;
            pos.setXYZ(i, x + noise, y + noise, z + noise);
        }

        geometry.computeVertexNormals();

        const solidMesh = new THREE.Mesh(geometry, biologicalMaterial);
        const wireMesh = new THREE.Mesh(geometry, techWireframe);

        // Slightly scale wireframe so it sits right on top
        wireMesh.scale.set(1.01, 1.01, 1.01);

        liverGroup.add(solidMesh);
        liverGroup.add(wireMesh);

        // Orient the anatomical liver correctly
        liverGroup.rotation.x = 0.3;
        liverGroup.rotation.y = -0.3;
    }

    // Try to load an external GLB model if the user provides one
    const loader = new THREE.GLTFLoader();
    loader.load(
        'assets/liver.glb',
        function (gltf) {
            const model = gltf.scene;

            // Apply materials to the loaded model
            model.traverse((child) => {
                if (child.isMesh) {
                    // Clone the geometry to add a wireframe overlay
                    const wire = new THREE.Mesh(child.geometry, techWireframe);
                    child.material = biologicalMaterial;
                    child.add(wire);
                }
            });

            // Center & Scale the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 3; // Approx width
            model.scale.setScalar(targetSize / maxDim);
            model.position.sub(center.multiplyScalar(targetSize / maxDim));

            liverGroup.add(model);
        },
        undefined, // onProgress
        function (error) {
            console.log('No assets/liver.glb found. Generating 3D anatomical liver procedurally.');
            createProceduralLiver();
        }
    );

    // 5. OrbitControls
    let controls;
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.minDistance = 3;
        controls.maxDistance = 8;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
        controls.minPolarAngle = Math.PI / 4;
        controls.maxPolarAngle = Math.PI / 1.5;
    }

    // 6. Animation Loop
    const animate = function () {
        requestAnimationFrame(animate);

        // Liver metabolic breathing/pulsing
        const scalePhase = Math.sin(Date.now() * 0.002) * 0.015 + 1;
        liverGroup.scale.set(scalePhase, scalePhase, scalePhase);

        // Tech scanner pulse
        techWireframe.opacity = 0.1 + Math.sin(Date.now() * 0.004) * 0.08;

        if (controls) {
            controls.update();
        }

        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight || 300;
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
    });

    // Handle Risk States
    window.Liver3D = {
        setRiskState: function (stateLine) {
            switch (stateLine) {
                case 'danger':
                    biologicalMaterial.color.setHex(0x5a1010); // Dead/Toxic red
                    biologicalMaterial.emissive.setHex(0x330000);
                    techWireframe.color.setHex(0xff3366);
                    rimLight.color.setHex(0xff3366);
                    break;
                case 'warning':
                    biologicalMaterial.color.setHex(0x7a3e10); // Inflamed orange/brown
                    biologicalMaterial.emissive.setHex(0x331c00);
                    techWireframe.color.setHex(0xffb74d);
                    rimLight.color.setHex(0xffb74d);
                    break;
                case 'safe':
                default:
                    biologicalMaterial.color.setHex(0x6e1b1b); // Healthy red
                    biologicalMaterial.emissive.setHex(0x1a0505);
                    techWireframe.color.setHex(0x00e5ff);
                    rimLight.color.setHex(0x00e5ff);
                    break;
            }
        }
    };
});
