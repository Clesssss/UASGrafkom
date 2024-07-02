import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
export class Enemy {
    constructor(scene) {
        this.scene = scene;
        this.animations = {}; //dictionary
        this.state = 'idle';
        this.event = 'idle';
        this.loadModel();
        this.addKeyListeners();

    }

    loadModel() {
        var loader = new FBXLoader();
        //loader.setPath("./resources/Knight");
        loader.setPath("./resources/Enemy/");
        loader.load('Zombie Idle.fbx', (fbx) => {
            // fbx.scale.setScalar(0.01);
            fbx.traverse(c => {
                c.castShadow = true;
            });
            this.mesh = fbx;
            this.scene.add(this.mesh);
            
            this.mesh.position.copy(new THREE.Vector3(-20, 0.5, 25));
            this.mesh.scale.setScalar(0.03);
            this.mesh.rotation.y = Math.PI; 

            this.mixer = new THREE.AnimationMixer(this.mesh);
            var onLoad = (animName, anim) => {
                var clip = anim.animations[0];
                var action = this.mixer.clipAction(clip);

                this.animations[animName] = {
                    clip: clip,
                    action: action
                };
            };

            var loader = new FBXLoader();
            loader.setPath("./resources/Enemy/");
            loader.load('Zombie Idle.fbx', (fbx) => { onLoad('idle', fbx); });
            loader.load('Zombie Death.fbx', (fbx) => { onLoad('death', fbx); });
            loader.load('Zombie Scream.fbx', (fbx) => { onLoad('scream', fbx); });
            loader.load('Zombie Scratch Idle.fbx', (fbx) => { onLoad('scratch', fbx); });

        });
    }
    addKeyListeners() {
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case '1':
                    this.event = 'idle';
                    break;
                case '2':
                    this.event = 'death';
                    break;
                case '3':
                    this.event = 'scream';
                    break;
                case '4':
                    this.event = 'scratch';
                    break;
                default:
                    break;
            }
        });
    }

    update(dt) {
        // console.log(this.state);
        if (!this.mesh) { return }

        if (this.event == 'idle'){
            if (this.animations['idle']) {
                if (this.state != 'idle') {
                    this.mixer.stopAllAction();
                    this.state = 'idle';
                }
                this.mixer.clipAction(this.animations['idle'].clip).play();

            }
        } else if (this.event == 'death'){
            if (this.animations['death']) {
                if (this.state != 'death') {
                    this.mixer.stopAllAction();
                    this.state = 'death';
                }
                this.mixer.clipAction(this.animations['death'].clip).play();

            }
        } else if (this.event == 'scream'){
            if (this.animations['scream']) {
                if (this.state != 'scream') {
                    this.mixer.stopAllAction();
                    this.state = 'scream';
                }
                this.mixer.clipAction(this.animations['scream'].clip).play();
             
            }
        } else if (this.event == 'scratch') {
            if (this.animations['scratch']) {
                if (this.state != 'scratch') {
                    this.mixer.stopAllAction();
                    this.state = 'scratch';
                }
                this.mixer.clipAction(this.animations['scratch'].clip).play();

            }
        }
       
        this.mixer.update(dt);
    }
   
}
