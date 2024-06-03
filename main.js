import * as THREE from "three";
import {Player, PlayerController, ThirdPersonCamera } from "./player.js";

class Main{
    static init(){
        var canvasRef = document.getElementById("canvas");
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth/window.innerHeight,
            0.1,1000
        );``
        this.renderer = new THREE.WebGLRenderer(
            {
                antialias:true, canvas:canvasRef
            }
        )
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x00000);
        this.renderer.shadowMap.enabled = true;

        //Plane
        var plane = new THREE.Mesh(
            new THREE.PlaneGeometry(40,40),
            new THREE.MeshPhongMaterial({color: 0xFFFFFF})
        )

        plane.rotation.x = -Math.PI/2;
        plane.receiveShadow = true;
        plane.castShadow = true;
        this.scene.add(plane);

        //directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF)
        directionalLight.castShadow = true;
        directionalLight.position.set(3,10,10);
        this.scene.add(directionalLight);

        var thirdPersonCamera = new ThirdPersonCamera(
            this.camera, new THREE.Vector3(-5,5,0), new THREE.Vector3(0,0,0)); 
            

        var controller = new PlayerController();

        this.player = new Player(
            thirdPersonCamera, controller, this.scene
        )
        }
        static render(dt){
            this.player.update(dt);
            this.renderer.render(this.scene, this.camera);
        }
    }

var clock = new THREE.Clock();
Main.init();
function animate(){
    Main.render(clock.getDelta());
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);