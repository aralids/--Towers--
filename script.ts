import * as React from "react";
import * as THREE from "three";
import { gsap, TweenLite } from "gsap";

"use strict";
console.clear();
class Stage {
    renderer;
    scene;
    camera;
    light;
    softLight;
    lookAt;
    constructor() {

        // Renderer, scene, camera.
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false})
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor("#D0CBC7", 1);
        document.getElementById("game")!.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        
        let aspect = window.innerWidth / window.innerHeight;
        let d = 20;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
        this.camera.position.x = 2;
        this.camera.position.y = 2;
        this.camera.position.z = 2;
        this.camera.lookAt(0, 0, 0);

        //Light.
        this.light = new THREE.SpotLight(0xffffff, 0.5);
        this.light.position.set(0, 499, 0);
        this.add(this.light);
        this.softLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.add(this.softLight);

        this.lookAt = {y:0};

        window.addEventListener("resize", () => this.onResize());
        this.onResize();
    }

    add(element):void {
        this.scene.add(element);
    }

    remove(element):void {
        this.scene.remove(element);
    }

    renderStage():void {
        this.renderer.render(this.scene, this.camera);
    }

    setCamera(y:number, speed:number = 0.3) {
        //gsap.to(this.camera.position, { duration:speed, y: y + 4, ease: Power1.easeInOut });
        // //this.camera.position.y = y + 2;
        // //this.camera.lookAt(0, y, 0);
        //gsap.to(this.lookAt, {duration: speed, y: y, ease: Power1.easeInOut, onUpdate: this.updateLookAt(this.camera, y) });
        TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
        TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
    }

    updateLookAt(camera, y):any {
        camera.lookAt(0, y, 0);
    }

    onResize() {
        let viewSize = 30;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.left = window.innerWidth / -viewSize;
        this.camera.right = window.innerWidth / viewSize;
        this.camera.top = window.innerHeight / viewSize;
        this.camera.bottom = window.innerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
    }
}

class Block {
    state:object = { "active": false, "stopped": true, "missed": false };
    dimension:object = { width: 10, height: 2, depth: 10 };
    position:object = { x: 0, y: 0, z: 0 };
    color = 0x333344;
    index:number = 0;
    colorOffset:number = Math.round(Math.random() * 100);
    speed:number = -4;
    direction:number = -4;
    workingPlane:string = "z";
    workingDimension:string = "depth";

    previousBlock:Block;
    mesh;
    geometry;
    material; 
    
    MOVE_AMOUNT:number = 12;
    constructor(previousBlock) {
        
        this.previousBlock = previousBlock;

        if (previousBlock) {
            this.index = previousBlock.index + 1;
            this.position["y"] = this.index * 2;
            this.colorOffset = 1 + previousBlock.colorOffset;
            var r = Math.sin(0.3 * this.colorOffset) * 55 + 200;
            var g = Math.sin(0.3 * this.colorOffset + 2) * 55 + 200;
            var b = Math.sin(0.3 * this.colorOffset + 4) * 55 + 200;
            this.color = new THREE.Color(r / 255, g / 255, b / 255);

            this.dimension["width"] = this.previousBlock.dimension["width"];
            this.dimension["depth"] = this.previousBlock.dimension["depth"];
            this.workingPlane = this.index % 2 ? "x" : "z";
            this.workingDimension = this.index % 2 ? "width" : "depth";
            this.position["x"] = this.previousBlock.position["x"];
            this.position["z"] = this.previousBlock.position["z"];

            this.speed = -0.1 - (this.index * 0.005);
            this.speed = this.speed < -4 ? -4 : this.speed;
            this.direction = this.speed;

            for (let key of Object.keys(this.state)) {
                this.state[key] = false;
            }
            this.state["active"] = true;
        }

        const geometry = new THREE.BoxGeometry(this.dimension["width"], this.dimension["height"], this.dimension["depth"]);
        this.material = new THREE.MeshToonMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(this.position["x"], this.position["y"], this.position["z"]);

        return this;
    }

    place():object {
        this.state = { "active": false, "stopped": true, "missed": false };
        let overlap:number = this.previousBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.previousBlock.position[this.workingPlane]); // calculate overlap size
        let blocksToReturn:object = { plane: this.workingPlane, direction: this.direction };
        if (this.dimension[this.workingDimension] - overlap < 0.3) { // if overlap is full or almost full
            overlap = this.dimension[this.workingDimension]; // keep the entire block unchopped
            blocksToReturn["bonus"] = true;
            this.position["x"] = this.previousBlock.position["x"]; // place perfectly over old block
            this.position["z"] = this.previousBlock.position["z"]; // place perfectly over old block
            this.dimension["width"] = this.previousBlock.dimension["width"]; // place perfectly over old block
            this.dimension["depth"] = this.previousBlock.dimension["depth"]; // place perfectly over old block
        }
        if (overlap > 0) { // if there is any overlap at all
            let choppedDimensions = { width: this.dimension["width"], height: this.dimension["height"], depth: this.dimension["depth"] };
            choppedDimensions[this.workingDimension] -= overlap; // width/depth of the block that will fall off
            this.dimension[this.workingDimension] = overlap; // width/depth of the block that stays 
            let placedGeometry = new THREE.BoxGeometry(this.dimension["width"], this.dimension["height"], this.dimension["depth"]);
            let placedMesh = new THREE.Mesh(placedGeometry, this.material);
            let choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            let choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
            let choppedPosition = { x: this.position["x"], y: this.position["y"], z: this.position["z"] };
            if (this.position[this.workingPlane] < this.previousBlock.position[this.workingPlane]) {
                this.position[this.workingPlane] = this.previousBlock.position[this.workingPlane] - (this.previousBlock.dimension[this.workingDimension] / 2 - overlap / 2);
            }
            else if (this.position[this.workingPlane] > this.previousBlock.position[this.workingPlane]) {
                this.position[this.workingPlane] = this.previousBlock.position[this.workingPlane] + (this.previousBlock.dimension[this.workingDimension] / 2 - overlap / 2);
            }
            else {
                choppedPosition[this.workingPlane] += overlap;
            }
            placedMesh.position.set(this.position["x"], this.position["y"], this.position["z"]);
            choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);
            blocksToReturn["placed"] = placedMesh;
            if (!blocksToReturn["bonus"])
                blocksToReturn["chopped"] = choppedMesh;
        }
        else {
            this.state = { "active": false, "stopped": false, "missed": true };
        }
        this.dimension[this.workingDimension] = overlap;
        return blocksToReturn;
    }

    tick():void {
        if (this.state["active"]) {
            let value = this.position[this.workingPlane];
            if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
                this.reverseDirection();
            this.position[this.workingPlane] += this.direction;
            this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
    }

    reverseDirection():void {
        this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
    }
}

class Game {
    state = { ready: false, playing: false, ended: false, resetting: false };
    stage = new Stage();
    blocks:Block[] = [];
    blockMeshes = new THREE.Group();
    newBlocks = new THREE.Group();
    placedBlocks = new THREE.Group();
    choppedBlocks = new THREE.Group();
    constructor() {
        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);

        this.addBlock();
        this.tick();
        this.updateState("ready");

        document.addEventListener("keydown", e => {
            if (e.keyCode == 32)
                this.onAction();
        });
        document.addEventListener("click", () => {
            this.onAction();
        });
    }

    updateState(newState):void {
        for (let key of Object.keys(this.state)) {
            document.getElementById("container")!.classList.remove(key);
            this.state[key] = false;
        }
        document.getElementById("container")!.classList.add(newState);
        this.state[newState] = true;
    }

    onAction():void {
        if (this.state["ready"]) { 
            this.startGame();
        }
        else if (this.state["playing"]) {
            console.log("playing")
            this.placeBlock();
        }
        else if (this.state["ended"]) {
            this.restartGame();
        }
    }

    startGame():void {
        document.getElementById("score")!.innerHTML = "0";
        this.updateState("playing");
        this.addBlock();
    }

    addBlock():void {
        let lastBlock:Block = this.blocks[this.blocks.length - 1];
        if (lastBlock && lastBlock.state["missed"] === true) {
            return this.endGame();
        }
        document.getElementById("score")!.innerHTML = String(this.blocks.length - 1);
        let newBlock:Block = new Block(lastBlock);
        this.newBlocks.add(newBlock.mesh);
        this.blocks.push(newBlock);
        this.stage.setCamera(this.blocks.length * 2);
        if (this.blocks.length >= 5) {
            document.getElementById("instructions")!.classList.add("hide");
        }
    }

    endGame():void {
        this.updateState("ended");
    }

    placeBlock():void {
        let currentBlock:Block = this.blocks[this.blocks.length - 1];
        let newBlocks:object = currentBlock.place();
        this.newBlocks.remove(currentBlock.mesh);
        if (newBlocks["placed"])
            this.placedBlocks.add(newBlocks["placed"]);
        if (newBlocks["chopped"]) {
            this.choppedBlocks.add(newBlocks["chopped"]);
            let positionParams = { y: "-=30", ease: Power1.easeIn, onComplete: () => this.choppedBlocks.remove(newBlocks["chopped"]) };
            let rotateRandomness = 10;
            let rotationParams = {
                delay: 0.05,
                x: newBlocks["plane"] == "z" ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                z: newBlocks["plane"] == "x" ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                y: Math.random() * 0.1,
            };
            if (newBlocks["chopped"]["position"][newBlocks["plane"]] > newBlocks["placed"]["position"][newBlocks["plane"]]) {
                positionParams[newBlocks["plane"]] = "+=" + (40 * Math.abs(newBlocks["direction"]));
            }
            else {
                positionParams[newBlocks["plane"]] = "-=" + (40 * Math.abs(newBlocks["direction"]));
            }
            TweenLite.to(newBlocks["chopped"]["position"], 1, positionParams);
            TweenLite.to(newBlocks["chopped"]["rotation"], 1, rotationParams);
        }
        this.addBlock();
    }

    restartGame() {
        this.updateState("resetting");
        let oldBlocks = this.placedBlocks.children;
        let removeSpeed = 0.2;
        let delayAmount = 0.02;
        for (let i = 0; i < oldBlocks.length; i++) {
            TweenLite.to(oldBlocks[i].scale, removeSpeed, { x: 0, y: 0, z: 0, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn, onComplete: () => this.placedBlocks.remove(oldBlocks[i]) });
            TweenLite.to(oldBlocks[i].rotation, removeSpeed, { y: 0.5, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn });
        }
        let cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount);
        this.stage.setCamera(2, cameraMoveSpeed);
        let countdown = { value: this.blocks.length - 1 };
        TweenLite.to(countdown, cameraMoveSpeed, { value: 0, onUpdate: () => { document.getElementById("score")!.innerHTML = String(Math.round(countdown.value)); } });
        this.blocks = this.blocks.slice(0, 1);
        setTimeout(() => {
            this.startGame();
        }, cameraMoveSpeed * 1000);
    }

    tick():void {
        this.blocks[this.blocks.length - 1].tick();
        this.stage.renderStage();
        requestAnimationFrame(() => { this.tick(); });
    }
}
let game = new Game();
