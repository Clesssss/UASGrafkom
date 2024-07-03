import * as THREE from "three";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";
export class Player{
    constructor(camera, controller, scene){
        this.camera = camera;
        this.controller = controller;
        this.scene = scene;
        this.rotationVector = new THREE.Vector3();
        this.animations = {}; //dictionary
        this.state = 'idle';
        this.camera.setup(new THREE.Vector3(0,0,0), this.rotationVector);
        // this.mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1,1,1),
        //     new THREE.MeshPhongMaterial({color: 0xff1111})
        // );
        // this.mesh.receiveShadow = true;
        // this.mesh.castShadow = true;
        // this.scene.add(this.mesh);
        // this.position = new THREE.Vector3(0,1.5,0);

        this.velocity = new THREE.Vector3();
        this.isJumping = false; //lagi loncat atau tidak
        this.jumpStrength = 10;// loncat e sak berapa
        this.gravity = new THREE.Vector3(0, -9.8, 0); //vektor gerak ke bawah 

        this.loadModel();
        
    }
    
    loadModel(){
        var loader = new FBXLoader();
        //loader.setPath("./resources/Knight");
        loader.setPath("./resources/Player/");
        loader.load('Sword And Shield Idle.fbx', (fbx)=> {
            // fbx.scale.setScalar(0.01);
            fbx.traverse(c=>{
                c.castShadow = true;
            });
            this.mesh = fbx;
            this.scene.add(this.mesh); //jalan secara asynchronous 
            // this.mesh.position.copy(new THREE.Vector3(0,0.5,0)); //on land
            this.mesh.position.copy(new THREE.Vector3(-10,20.68,-20)); // top of building
            this.mesh.rotation.y = Math.PI; 

            this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
            const helperww = new THREE.Box3Helper(this.boundingBox, 0xffff00);
            this.scene.add(helperww);
            this.mesh.scale.setScalar(0.0095);

            this.mixer = new THREE.AnimationMixer(this.mesh);
            var onLoad = (animName, anim) => {
                var clip = anim.animations[0];
                var action = this.mixer.clipAction(clip);

                this.animations[animName] = {
                    clip:clip,
                    action:action
                };
            };

            var loader = new FBXLoader();
            loader.setPath("./resources/Player/");
            loader.load('Sword And Shield Idle.fbx', (fbx)=>{onLoad('idle', fbx);});
            loader.load('Sword And Shield Run.fbx', (fbx)=>{onLoad('run', fbx);});
            loader.load('Jumping Up.fbx',(fbx)=>{onLoad('jump',fbx);});

        });
    }
    
    update (dt){
        if(!this.mesh){return} //karena catatan diatas
        var direction = new THREE.Vector3(0,0,0);
        if(this.controller.keys['forward']){
            direction.x = 1;
        }
        if(this.controller.keys['backward']){
            direction.x = -1;
        }
        if(this.controller.keys['left']){
            direction.z = -1;
        }
        if(this.controller.keys['right']){
            direction.z = 1;
        }
        if (this.controller.keys['upward'] && !this.isJumping) {
            this.isJumping = true; //lagi loncat kan makae true
            this.velocity.y = this.jumpStrength; //kecepatan loncat e 10
        }

        var dtMouse = this.controller.deltaMousePos;
        dtMouse.x = dtMouse.x/Math.PI;
        dtMouse.y /= Math.PI;
        this.rotationVector.y += dtMouse.x;
        this.rotationVector.z += dtMouse.y;

        this.mesh.rotation.y = this.rotationVector.y + Math.PI/2;
        if(direction.length() == 0){
            if(this.animations['idle']){
                if(this.state != 'idle'){
                    this.mixer.stopAllAction();
                    this.state = 'idle';
                }
                this.mixer.clipAction(this.animations['idle'].clip).play();
                this.mixer.update(dt);
            }
        }else if (this.isJumping) {
            if (this.state !== 'jump' && this.animations['jump']) {
                this.mixer.stopAllAction();
                this.animations['jump'].action.play();
                this.state = 'jump';
                this.mixer.clipAction(this.animations['jump'].clip).play();
                this.mixer.update(dt);
            }
        }
        else{
            if(this.animations['run']){
                if(this.state != 'run'){
                    this.mixer.stopAllAction();
                    this.state = 'run';
                }
                this.mixer.clipAction(this.animations['run'].clip).play();
                this.mixer.update(dt);
            } 
        }


        if (this.isJumping) {
            this.velocity.add(this.gravity.clone().multiplyScalar(dt)); //nek misal jump langsung dikenakan seuah gravitasi
            this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));

            if (this.checkCollision(this.mesh.position)) {
                this.isJumping = false;
                this.velocity.y = 0;
            }
        }
        var forwardVector = new THREE.Vector3(1, 0, 0);
        var rightVector = new THREE.Vector3(0, 0, 1);
        forwardVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVector.y);
        rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVector.y);

        var newPosition = this.mesh.position.clone();

        if (direction.x !== 0) {
            var forwardMovement = forwardVector.clone().multiplyScalar(dt * 10 * direction.x);
            if (!this.checkCollision(newPosition.clone().add(forwardMovement))) { //cek collision
                newPosition.add(forwardMovement);
            }
        }

        if (direction.z !== 0) {
            var rightMovement = rightVector.clone().multiplyScalar(dt * 10 * direction.z);
            if (!this.checkCollision(newPosition.clone().add(rightMovement))) { //cek collision
                newPosition.add(rightMovement);
            }
        }

        this.mesh.position.copy(newPosition);
        this.mixer.update(dt);
        this.camera.setup(this.mesh.position, this.rotationVector);
    }
    //memeriksa collision nya baik arah x atau z (forward sm right)
    checkCollision(position) {
        var boundingBox = new THREE.Box3().setFromObject(this.mesh);
        boundingBox.translate(position.clone().sub(this.mesh.position)); //posisi e dicopas terus di kurangi

        var collisionDetected = false;
        this.scene.traverse(function (child) {
            if (child.isMesh && child.boundingBox) {
                if (child.name !== "Kachujin" && !child.name.includes("CARRETERAS") && child.name !== "parasiteZombie") { //soale kenek kachujin terus ambe carretas
                    var box = new THREE.Box3().setFromObject(child);
                    if (box.intersectsBox(boundingBox)) {
                        console.log(child.name);
                        collisionDetected = true;
                    }
                }
            }
        });
        return collisionDetected;
    }
}
export class PlayerController{
    constructor(){
        this.keys = {
            "forward" : false,
            "backward" : false,
            "left" : false,
            "right" : false,
            "upward": false,
            "downward": false,
        };
        this.mousePos = new THREE.Vector2();
        this.mouseDown = false;
        this.deltaMousePos = new THREE.Vector2();
        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);

    }
    requestPointerLock() {
        document.body.requestPointerLock();
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
    onMouseDown(event){
        this.mouseDown = true;
        this.requestPointerLock();
    }
    onMouseUp(event){
        this.mouseDown = false;
    }
    onMouseMove(event){
        if (document.pointerLockElement === document.body) {
            this.deltaMousePos.x += event.movementX / window.innerWidth * 2;
            this.deltaMousePos.y -= event.movementY / window.innerHeight * 2;
        } else {
            var currentMousePos = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1
            );
            this.deltaMousePos.addVectors(currentMousePos, this.mousePos.multiplyScalar(-1));
            this.mousePos.copy(currentMousePos);
        }
    // console.log(this.mousePos);
    }
    onKeyDown (event){
        console.log(event);
        switch(event.key){
            case 'W':
                case 'w': this.keys["forward"] = true; break;
            case 'S':
                case 's': this.keys["backward"] = true; break;
            case 'A':
                case 'a': this.keys["left"] = true; break;
            case 'D':
                case 'd': this.keys["right"] = true; break;
            case 'ArrowUp': this.keys["upward"] = true; break;
            case 'ArrowDown': this.keys["downward"] = true; break;

        }
    }
    onKeyUp(event){
        console.log(event);
        switch(event.key){
            case 'W':
                case 'w': this.keys["forward"] = false; break;
            case 'S':
                case 's': this.keys["backward"] = false; break;
            case 'A':   
                case 'a': this.keys["left"] = false; break;
            case 'D':
                case 'd': this.keys["right"] = false; break;
            case 'ArrowUp': this.keys["upward"] = false; break;
            case 'ArrowDown': this.keys["downward"] = false; break;

        }
    }
}
export class ThirdPersonCamera {
    constructor(camera, positionOffset, targetOffset) {
        this.camera = camera;
        this.positionOffset = positionOffset;
        this.targetOffset = targetOffset;
    }

    setup(targetPosition, rotationVector) {
        // Calculate the camera's position offset from the target's position
        const offset = new THREE.Vector3();
        offset.copy(this.positionOffset);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationVector.y);

        // Position the camera
        const cameraPosition = new THREE.Vector3();
        cameraPosition.addVectors(targetPosition, offset);

        // Check for collisions and adjust camera position
        const collisionFreePosition = this.adjustForCollisions(targetPosition, cameraPosition);

        this.camera.position.copy(collisionFreePosition);

        // Calculate the camera's target position
        const target = new THREE.Vector3();
        target.copy(targetPosition);
        target.add(this.targetOffset);

        // Make the camera look at the target
        this.camera.lookAt(target);
    }

    adjustForCollisions(targetPosition, desiredCameraPosition) {
        const direction = new THREE.Vector3().subVectors(desiredCameraPosition, targetPosition).normalize();
        const raycaster = new THREE.Raycaster(targetPosition, direction);
        const intersections = raycaster.intersectObjects(this.cameraCollisionObjects, true);

        if (intersections.length > 0 && intersections[0].distance < this.positionOffset.length()) {
            return intersections[0].point.addScaledVector(direction, -0.1); // Move the camera slightly back from the collision point
        }

        return desiredCameraPosition;
    }

    setCollisionObjects(objects) {
        this.cameraCollisionObjects = objects;
    }
}

