import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import  {PlayerController, ThirdPersonCamera, Player} from "./playerCleanUp.js";
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
        .setPath( './city-suburbs/source/TRABAJO COMPRIMIDOO/' )
        .load( 'TRABAJO COMPRIMIDOO.mtl', function ( materials ) {
            materials.preload();
            new OBJLoader()
                .setMaterials( materials )
                .setPath( './city-suburbs/source/TRABAJO COMPRIMIDOO/' )
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
                            // let xSum = 0, ySum = 0, zSum = 0;
                            let x=0, y=0, z=0;
                    
                            for (let i = 0; i < positions.count; i++) {
                                x = positions.getX(i);
                                y = positions.getY(i);
                                z = positions.getZ(i);
                                // xSum += positions.getX(i);
                                // ySum += positions.getY(i);
                                // zSum += positions.getZ(i);
                            }
                    
                            // const x = xSum / positions.count;
                            // const y = ySum / positions.count;
                            // const z = zSum / positions.count;
                    
                            console.log(`Lamp Centroid: (${x}, ${y}, ${z})`);
                    
                            //Add a point light to the lamp's centroid position
                            const pointLight = new THREE.PointLight(0xffffff, 1, 100000);
                            // const directLight = new THREE.DirectionalLight(0xffffff);
                            
                            

                            //const ambientLight1 = new THREE.AmbientLight(0xffffff,0.1);
                            pointLight.position.set(x-1, y-1, z+1);
                            //pointLight.castShadow = true;

                            // directLight.position.set(x-1, y-1, z+1);

                            
                            Main.scene.add(pointLight);
                            // Main.scene.add(directLight);
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
        var thirdPersonCamera = new ThirdPersonCamera(
            this.camera, 
            new THREE.Vector3(-5,5,0), 
            new THREE.Vector3(0,0,0)
        );
        //thirdPersonCamera.setup(new THREE.Vector3(0,0,0));

        var controller = new PlayerController();

        this.player = new Player(
            thirdPersonCamera,
            controller, 
            this.scene);
    }
    
    static render (dt){
        this.player.update(dt);
        this.renderer.render(this.scene, this.camera);
        this.scene.traverse(function (child) {
            if (child.isMesh && child.boundingBox) {
                var box = new THREE.Box3().setFromObject(child);
                if (box.intersectsBox(Main.player.boundingBox)) {
                    console.log('Collision detected with', child.name);
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
