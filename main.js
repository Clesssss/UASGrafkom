import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import  {PlayerController, ThirdPersonCamera, Player} from "./player.js";

class FreeCamera {
    constructor(camera) {
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.speed = 5;
        this.rollSpeed = 0.05;
        this.keys = {
            "forward": false,
            "backward": false,
            "left": false,
            "right": false,
            "up": false,
            "down": false,
            "rollLeft": false,
            "rollRight": false
        };  

        this.pitch = 0; // Keep track of the pitch angle
        this.maxPitch = 1.8;
        this.minPitch = -1.34;

        // Initialize pitch and yaw as quaternions
        this.pitchQuaternion = new THREE.Quaternion();
        this.yawQuaternion = new THREE.Quaternion();
        this.rollQuaternion = new THREE.Quaternion();

        this.defaultFov = this.camera.fov;
        this.zoomSpeed = 2;

        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);
        document.addEventListener('wheel', (e) => this.onMouseWheel(e), false);
    }

    onKeyDown(event) {
        switch (event.key) {
            case 'w': this.keys["forward"] = true; break;
            case 's': this.keys["backward"] = true; break;
            case 'a': this.keys["left"] = true; break;
            case 'd': this.keys["right"] = true; break;
            case 'r': this.keys["up"] = true; break;
            case 'f': this.keys["down"] = true; break;
            case 'z': this.keys["rollLeft"] = true; break;
            case 'x': this.keys["rollRight"] = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.key) {
            case 'w': this.keys["forward"] = false; break;
            case 's': this.keys["backward"] = false; break;
            case 'a': this.keys["left"] = false; break;
            case 'd': this.keys["right"] = false; break;
            case 'r': this.keys["up"] = false; break;
            case 'f': this.keys["down"] = false; break;
            case 'z': this.keys["rollLeft"] = false; break;
            case 'x': this.keys["rollRight"] = false; break;
        }
    }

    onPointerLockChange() {
        if (document.pointerLockElement === document.body) {
            console.log('Pointer locked');
        } else {
            console.log('Pointer unlocked');
        }
    }

    onPointerLockError() {
        console.error('Pointer lock error');
    }

    onMouseWheel(event) {
        this.camera.fov -= event.deltaY * 0.05;
        this.camera.fov = Math.max(10, Math.min(75, this.camera.fov));
        this.camera.updateProjectionMatrix();
    }

    onMouseMove(event) {
        if (document.pointerLockElement === document.body) {
            var pitchDelta = -event.movementY * 0.002; //pitch (up/down)
            const yawDelta = -event.movementX * 0.002; //yaw (left/right)

            if (this.pitch+pitchDelta < this.minPitch){
                pitchDelta = this.minPitch - this.pitch
            } else if (this.pitch+pitchDelta > this.maxPitch){
                pitchDelta = this.maxPitch - this.pitch
            }
            this.pitch += pitchDelta;

            // Update pitch and yaw quaternion
            this.pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta);
            this.yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawDelta);

            // Apply quaternions
            this.camera.quaternion.multiplyQuaternions(this.yawQuaternion, this.camera.quaternion);
            this.camera.quaternion.multiplyQuaternions(this.camera.quaternion, this.pitchQuaternion);

            console.log(this.pitch);
        }
    }

    update(delta) {
        this.velocity.set(0, 0, 0);

        if (this.keys["forward"]) this.velocity.z -= this.speed * delta;
        if (this.keys["backward"]) this.velocity.z += this.speed * delta;
        if (this.keys["left"]) this.velocity.x -= this.speed * delta;
        if (this.keys["right"]) this.velocity.x += this.speed * delta;
        if (this.keys["up"]) this.velocity.y += this.speed * delta;
        if (this.keys["down"]) this.velocity.y -= this.speed * delta;

        this.camera.translateX(this.velocity.x);
        this.camera.translateY(this.velocity.y);
        this.camera.translateZ(this.velocity.z);

        if (this.keys["rollLeft"]) {
            this.rollQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.rollSpeed * delta*10);
            this.camera.quaternion.multiplyQuaternions(this.camera.quaternion, this.rollQuaternion);
        }
        if (this.keys["rollRight"]) {
            this.rollQuaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -this.rollSpeed * delta*10);
            this.camera.quaternion.multiplyQuaternions(this.camera.quaternion, this.rollQuaternion);
        }
    }
}

export { FreeCamera };


class Main{
    static init(){
        var canvasRef = document.getElementById("canvas");
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, canvas:canvasRef
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.renderer.shadowMap.enabled = true;


        //Plane
        var world = new THREE.Mesh();
        world.receiveShadow = true;
        world.castShadow = true;
        this.scene.add(world);

        //World
        new MTLLoader()
        .setPath( './resources/city-suburbs/source/TRABAJO COMPRIMIDOO/' )
        .load( 'TRABAJO COMPRIMIDOO.mtl', function ( materials ) {
            materials.preload();
            new OBJLoader()
                .setMaterials( materials )
                .setPath( './resources/city-suburbs/source/TRABAJO COMPRIMIDOO/' )
                .load( 'TRABAJO COMPRIMIDOO.obj', function ( object ) {
                    world.add( object );
                    object.position.set(0,0,0);
                    object.scale.set( 1,1,1 );
                    object.traverse( function ( child ) {
                        if ( child.isMesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.geometry.computeBoundingBox();
                            child.boundingBox = child.geometry.boundingBox.clone();

                            const helper = new THREE.Box3Helper(child.boundingBox, 0xffff00);
                            Main.scene.add(helper);
                        }
                    } );
                    object.traverse(function (child) {
                        if (child.isMesh && child.name.includes('Farola')) {
                            console.log('Lamp Found:', child.name);
                    
                            const positions = child.geometry.attributes.position;
                            let xSum = 0, ySum = 0, zSum = 0;
                            for (let i = 0; i < positions.count; i++) {
                                xSum += positions.getX(i);
                                ySum += positions.getY(i);
                                zSum += positions.getZ(i);
                            }
                            const x = xSum / positions.count;
                            const y = ySum / positions.count;
                            const z = zSum / positions.count;
                    
                            console.log(`Lamp Centroid: (${x}, ${y}, ${z})`);
                    
                            //Add a point light to the lamp's centroid position
                            const pointLight = new THREE.PointLight(0xffffff, 1, 100000);
                            const helperpl = new THREE.PointLightHelper(pointLight);
                            //const directLight = new THREE.DirectionalLight(0xffffff);
                            
                            

                            //const ambientLight1 = new THREE.AmbientLight(0xffffff,0.1);
                            pointLight.position.set(x-1, y-1, z+1);
                            // pointLight.castShadow = true;

                            // directLight.position.set(x-1, y-1, z+1);

                            
                            Main.scene.add(pointLight);
                            Main.scene.add(helperpl);
                            //Main.scene.add(ambientLight1);
                    
                            // Log the light position
                            console.log('Light Position:', pointLight.position);
                        }
                    });
                });
        } );

        //Directional Light
        var directionalLight = new THREE.DirectionalLight(0xffffff,0.01);
        directionalLight.castShadow = true;

        directionalLight.position.set(3,10,10);
        this.scene.add(directionalLight);

        var ambientLight = new THREE.AmbientLight(0xff6666, 0.01);
        this.scene.add(ambientLight);

        var hemisphereLight = new THREE.HemisphereLight(0xB1e1ff, 0xB97a20, 0.1);
        this.scene.add(hemisphereLight);

        this.isFreeCamera = false;
        this.freeCamera = new FreeCamera(this.camera);
        this.thirdPersonCamera = new ThirdPersonCamera(
            this.camera,
            new THREE.Vector3(-5, 2, 0),
            new THREE.Vector3(0, 0, 0)
        );

        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);

        var controller = new PlayerController();

        this.player = new Player(
            this.thirdPersonCamera,
            controller,
            this.scene
        );
    }
    
    static onKeyDown(event) {
        if (event.key === 'e') {
            this.isFreeCamera = !this.isFreeCamera;
            this.freeCamera.pitch = 0;
        }
    }

    static render(dt) {
        if (this.isFreeCamera) {
            this.freeCamera.update(dt);
        } else {
            this.player.update(dt);
        }

        this.renderer.render(this.scene, this.camera);
        this.scene.traverse(function (child) {
            if (child.isMesh && child.boundingBox) {
                var box = new THREE.Box3().setFromObject(child);
                if (box.intersectsBox(Main.player.boundingBox)) {
                    // console.log('Collision detected with', child.name);
                }
            }
        });
    }
}
var clock = new THREE.Clock();
Main.init();
function animate(){
    Main.render(clock.getDelta());
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
