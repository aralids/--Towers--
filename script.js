"use strict";
exports.__esModule = true;
var THREE = require("three");
var gsap_1 = require("gsap");
"use strict";
console.clear();
var Stage = /** @class */ (function () {
    function Stage() {
        var _this = this;
        // Renderer, scene, camera.
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor("#D0CBC7", 1);
        document.getElementById("game").appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
        var aspect = window.innerWidth / window.innerHeight;
        var d = 20;
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
        this.lookAt = { y: 0 };
        window.addEventListener("resize", function () { return _this.onResize(); });
        this.onResize();
    }
    Stage.prototype.add = function (element) {
        this.scene.add(element);
    };
    Stage.prototype.remove = function (element) {
        this.scene.remove(element);
    };
    Stage.prototype.renderStage = function () {
        this.renderer.render(this.scene, this.camera);
    };
    Stage.prototype.setCamera = function (y, speed) {
        if (speed === void 0) { speed = 0.3; }
        //gsap.to(this.camera.position, { duration:speed, y: y + 4, ease: Power1.easeInOut });
        // //this.camera.position.y = y + 2;
        // //this.camera.lookAt(0, y, 0);
        //gsap.to(this.lookAt, {duration: speed, y: y, ease: Power1.easeInOut, onUpdate: this.updateLookAt(this.camera, y) });
        gsap_1.TweenLite.to(this.camera.position, speed, { y: y + 4, ease: Power1.easeInOut });
        gsap_1.TweenLite.to(this.camera.lookAt, speed, { y: y, ease: Power1.easeInOut });
    };
    Stage.prototype.updateLookAt = function (camera, y) {
        camera.lookAt(0, y, 0);
    };
    Stage.prototype.onResize = function () {
        var viewSize = 30;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.left = window.innerWidth / -viewSize;
        this.camera.right = window.innerWidth / viewSize;
        this.camera.top = window.innerHeight / viewSize;
        this.camera.bottom = window.innerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
    };
    return Stage;
}());
var Block = /** @class */ (function () {
    function Block(previousBlock) {
        this.state = { "active": false, "stopped": true, "missed": false };
        this.dimension = { width: 10, height: 2, depth: 10 };
        this.position = { x: 0, y: 0, z: 0 };
        this.color = 0x333344;
        this.index = 0;
        this.colorOffset = Math.round(Math.random() * 100);
        this.speed = -4;
        this.direction = -4;
        this.workingPlane = "z";
        this.workingDimension = "depth";
        this.MOVE_AMOUNT = 12;
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
            for (var _i = 0, _a = Object.keys(this.state); _i < _a.length; _i++) {
                var key = _a[_i];
                this.state[key] = false;
            }
            this.state["active"] = true;
        }
        var geometry = new THREE.BoxGeometry(this.dimension["width"], this.dimension["height"], this.dimension["depth"]);
        this.material = new THREE.MeshToonMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(this.position["x"], this.position["y"], this.position["z"]);
        return this;
    }
    Block.prototype.place = function () {
        this.state = { "active": false, "stopped": true, "missed": false };
        var overlap = this.previousBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.previousBlock.position[this.workingPlane]); // calculate overlap size
        var blocksToReturn = { plane: this.workingPlane, direction: this.direction };
        if (this.dimension[this.workingDimension] - overlap < 0.3) { // if overlap is full or almost full
            overlap = this.dimension[this.workingDimension]; // keep the entire block unchopped
            blocksToReturn["bonus"] = true;
            this.position["x"] = this.previousBlock.position["x"]; // place perfectly over old block
            this.position["z"] = this.previousBlock.position["z"]; // place perfectly over old block
            this.dimension["width"] = this.previousBlock.dimension["width"]; // place perfectly over old block
            this.dimension["depth"] = this.previousBlock.dimension["depth"]; // place perfectly over old block
        }
        if (overlap > 0) { // if there is any overlap at all
            var choppedDimensions = { width: this.dimension["width"], height: this.dimension["height"], depth: this.dimension["depth"] };
            choppedDimensions[this.workingDimension] -= overlap; // width/depth of the block that will fall off
            this.dimension[this.workingDimension] = overlap; // width/depth of the block that stays 
            var placedGeometry = new THREE.BoxGeometry(this.dimension["width"], this.dimension["height"], this.dimension["depth"]);
            var placedMesh = new THREE.Mesh(placedGeometry, this.material);
            var choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
            var choppedMesh = new THREE.Mesh(choppedGeometry, this.material);
            var choppedPosition = { x: this.position["x"], y: this.position["y"], z: this.position["z"] };
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
    };
    Block.prototype.tick = function () {
        if (this.state["active"]) {
            var value = this.position[this.workingPlane];
            if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
                this.reverseDirection();
            this.position[this.workingPlane] += this.direction;
            this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
    };
    Block.prototype.reverseDirection = function () {
        this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
    };
    return Block;
}());
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.state = { ready: false, playing: false, ended: false, resetting: false };
        this.stage = new Stage();
        this.blocks = [];
        this.blockMeshes = new THREE.Group();
        this.newBlocks = new THREE.Group();
        this.placedBlocks = new THREE.Group();
        this.choppedBlocks = new THREE.Group();
        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);
        this.addBlock();
        this.tick();
        this.updateState("ready");
        document.addEventListener("keydown", function (e) {
            if (e.keyCode == 32)
                _this.onAction();
        });
        document.addEventListener("click", function () {
            _this.onAction();
        });
    }
    Game.prototype.updateState = function (newState) {
        for (var _i = 0, _a = Object.keys(this.state); _i < _a.length; _i++) {
            var key = _a[_i];
            document.getElementById("container").classList.remove(key);
            this.state[key] = false;
        }
        document.getElementById("container").classList.add(newState);
        this.state[newState] = true;
    };
    Game.prototype.onAction = function () {
        if (this.state["ready"]) {
            this.startGame();
        }
        else if (this.state["playing"]) {
            console.log("playing");
            this.placeBlock();
        }
        else if (this.state["ended"]) {
            this.restartGame();
        }
    };
    Game.prototype.startGame = function () {
        document.getElementById("score").innerHTML = "0";
        this.updateState("playing");
        this.addBlock();
    };
    Game.prototype.addBlock = function () {
        var lastBlock = this.blocks[this.blocks.length - 1];
        if (lastBlock && lastBlock.state["missed"] === true) {
            return this.endGame();
        }
        document.getElementById("score").innerHTML = String(this.blocks.length - 1);
        var newBlock = new Block(lastBlock);
        this.newBlocks.add(newBlock.mesh);
        this.blocks.push(newBlock);
        this.stage.setCamera(this.blocks.length * 2);
        if (this.blocks.length >= 5) {
            document.getElementById("instructions").classList.add("hide");
        }
    };
    Game.prototype.endGame = function () {
        this.updateState("ended");
    };
    Game.prototype.placeBlock = function () {
        var _this = this;
        var currentBlock = this.blocks[this.blocks.length - 1];
        var newBlocks = currentBlock.place();
        this.newBlocks.remove(currentBlock.mesh);
        if (newBlocks["placed"])
            this.placedBlocks.add(newBlocks["placed"]);
        if (newBlocks["chopped"]) {
            this.choppedBlocks.add(newBlocks["chopped"]);
            var positionParams = { y: "-=30", ease: Power1.easeIn, onComplete: function () { return _this.choppedBlocks.remove(newBlocks["chopped"]); } };
            var rotateRandomness = 10;
            var rotationParams = {
                delay: 0.05,
                x: newBlocks["plane"] == "z" ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                z: newBlocks["plane"] == "x" ? ((Math.random() * rotateRandomness) - (rotateRandomness / 2)) : 0.1,
                y: Math.random() * 0.1
            };
            if (newBlocks["chopped"]["position"][newBlocks["plane"]] > newBlocks["placed"]["position"][newBlocks["plane"]]) {
                positionParams[newBlocks["plane"]] = "+=" + (40 * Math.abs(newBlocks["direction"]));
            }
            else {
                positionParams[newBlocks["plane"]] = "-=" + (40 * Math.abs(newBlocks["direction"]));
            }
            gsap_1.TweenLite.to(newBlocks["chopped"]["position"], 1, positionParams);
            gsap_1.TweenLite.to(newBlocks["chopped"]["rotation"], 1, rotationParams);
        }
        this.addBlock();
    };
    Game.prototype.restartGame = function () {
        var _this = this;
        this.updateState("resetting");
        var oldBlocks = this.placedBlocks.children;
        var removeSpeed = 0.2;
        var delayAmount = 0.02;
        var _loop_1 = function (i) {
            gsap_1.TweenLite.to(oldBlocks[i].scale, removeSpeed, { x: 0, y: 0, z: 0, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn, onComplete: function () { return _this.placedBlocks.remove(oldBlocks[i]); } });
            gsap_1.TweenLite.to(oldBlocks[i].rotation, removeSpeed, { y: 0.5, delay: (oldBlocks.length - i) * delayAmount, ease: Power1.easeIn });
        };
        for (var i = 0; i < oldBlocks.length; i++) {
            _loop_1(i);
        }
        var cameraMoveSpeed = removeSpeed * 2 + (oldBlocks.length * delayAmount);
        this.stage.setCamera(2, cameraMoveSpeed);
        var countdown = { value: this.blocks.length - 1 };
        gsap_1.TweenLite.to(countdown, cameraMoveSpeed, { value: 0, onUpdate: function () { document.getElementById("score").innerHTML = String(Math.round(countdown.value)); } });
        this.blocks = this.blocks.slice(0, 1);
        setTimeout(function () {
            _this.startGame();
        }, cameraMoveSpeed * 1000);
    };
    Game.prototype.tick = function () {
        var _this = this;
        this.blocks[this.blocks.length - 1].tick();
        this.stage.renderStage();
        requestAnimationFrame(function () { _this.tick(); });
    };
    return Game;
}());
var game = new Game();
