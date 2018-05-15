import { ElementRef, Injectable } from '@angular/core';
import * as THREE from 'three';
//import { OrbitControls } from 'three-orbitcontrols-ts';
declare const require: (moduleId: string) => any;
var ExtraControls = require('three-orbitcontrols');
import * as Stats from "../../assets/js/stats.js/build/stats.js";

import {PeriodicService} from '../periodic.service';

@Injectable()
export class ThreedService {

    backgroundObject: any = undefined;
    camera = undefined;
    cameraControls = undefined;
    clearColour = '#d0d0d0';
    element = undefined;
    objectQueue: THREE.Object3D[] = [];
    raycaster = undefined;
    renderer = undefined;
    //scene = new THREE.Scene();
    scene = undefined;
    sizeX: number = undefined;
    sizeY: number = undefined;
    stats: any = undefined;
    tasks: { [name: string]: { cb: Function, owner: string }} = {};

    constructor(private periodicService: PeriodicService) { }

    initialiseThree(sizeX: number, sizeY: number, element: ElementRef) {
        console.log(Stats);
        this.stats = [Stats(), Stats(), Stats()];
        this.stats[0].showPanel(0);
        this.stats[1].showPanel(1);
        this.stats[2].showPanel(2);
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.element = element;
        this.initScene();
        this.periodicService.registerTask('3d draw', this, this.animate);
    }

    add(obj) {
        if (this.scene === undefined) {
            this.objectQueue.push(obj)
        } else {
            this.scene.add(obj);
        }
    }

    addAnimationTask(name: string, method: Function, owner) {
        this.tasks[name] = {
            cb: method,
            owner: owner
        }
    }


    addBackgroundImage(path: string, z: number) {
        this.removeBackgroundImage();
        const loader = new THREE.TextureLoader();
        const siht = this;
        loader.load(path,
            function(img) {
                const geometry = new THREE.PlaneGeometry(siht.sizeX, siht.sizeY);
                const material = new THREE.MeshBasicMaterial({map: img, opacity: 1.0, transparent: true});
                if (siht.backgroundObject !== undefined) {
                    siht.scene.remove(siht.backgroundObject);
                }
                siht.backgroundObject = new THREE.Mesh(geometry, material);
                siht.backgroundObject.name = 'background-image';
                siht.backgroundObject.position.z = z;
                siht.scene.add(siht.backgroundObject);
                siht.backgroundObject.visible = true;
            },
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            function ( xhr ) {
                console.log( 'An error happened' );
            });

    }

    addLighting(x: number, y: number, z: number) {
        let ambientLight = new THREE.AmbientLight(0xddddff, 0.3);
        ambientLight.name = 'AmbientLight';
        this.scene.add(ambientLight);

        // where lighting aims
        const lightTarget = new THREE.Object3D();
        lightTarget.position.set(0, 0, 0);
        lightTarget.name = 'lightTarget';
        this.scene.add(lightTarget);

        const hemiLight = new THREE.HemisphereLight(0xddddff, 0xddffdd, 0.6);
        hemiLight.position.set(50, 50, 400);
        hemiLight.name = 'hemilight';
        hemiLight.target = lightTarget;
        this.scene.add(hemiLight);

        const light = new THREE.DirectionalLight(0x7f3333, 1);
        light.position.set(50, 50, 500);
        light.position.multiplyScalar(1.3);

        light.castShadow = true;

        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;

        const d = 1000;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;

        light.shadow.camera.far = 1000;

        light.target = lightTarget;
        this.scene.add(light);
    }

    addToGroup(name: string, obj: THREE.Object3D) {
        let group = this.scene.getObjectByName(name);
        if (group !== undefined) {
            group.add(obj);
        }
    }

    animate(owner: any) {
        owner.stats[0].begin();
        owner.stats[1].begin();
        owner.stats[2].begin();
        owner.render();
        owner.stats[0].end();
        owner.stats[1].begin();
        owner.stats[2].begin();
    }

    dropNode(addr: string) {
        console.log('dropping', addr, this.scene);
        if (this.scene !== undefined) {
            let selectedObject = this.scene.getObjectByName('g_biot-' + addr);
            if (selectedObject !== undefined) {
                console.log('dropped', selectedObject);
                selectedObject.parent.remove(selectedObject);
                this.render();
            } else {
                console.log('cannot find', addr);
            }
        } else {
            console.log('scene does not exist yet...?');
        }
    }

    getCanvasColour ( color ) {
        return 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
    }

    hexColourToObject(hex: string) {
        hex = hex.replace(/^#/, '');
        const bigint = parseInt(hex, 16);
        const obj = { };
        obj['r'] = (bigint >> 16) & 255;
        obj['g'] = (bigint >> 8) & 255;
        obj['b'] = bigint & 255;
        obj['a'] = 1.0;
        return obj;
    }


    getIntersectPoint(point) {
        let intersects = [];
        if (isFinite(point.x) && isFinite(point.y)) {
            const obs = [];
            this.scene.traverse(function(ob) {
                obs.push(ob);
            });
            this.raycaster.setFromCamera(point, this.camera);
            intersects = this.raycaster.intersectObjects(obs);
        }
        return intersects;
    }

    getStats() {
        return this.stats;
    }

    initScene() {

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.preserveDrawingBuffer = true ;
        this.renderer.setClearColor(this.clearColour, 1);
        this.renderer.setSize( this.sizeX, this.sizeY );
        this.renderer.shadowMap.enabled = true;
        this.element.nativeElement.appendChild( this.renderer.domElement );
        this.raycaster = new THREE.Raycaster();

        console.log('making scene');
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 45, this.sizeX / this.sizeY, 0.1, 10000 );
        // this.camera = new THREE.OrthographicCamera(this.sizeX / -2, this.sizeX / 2, this.sizeY / 2, this.sizeY / -2, 1, 1000);
        this.camera.name = 'camera';
        this.scene.add(this.camera);
        this.camera.up.set( 0, 0, 1 );
        this.camera.position.x =  200; // ~ 2 metres
        this.camera.position.y = 0;
        this.camera.position.z = 0;
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        this.cameraControls = new ExtraControls( this.camera, this.renderer.domElement  );
        //this.cameraControls = new OrbitControls( this.camera, this.renderer.domElement  );
        this.cameraControls.rotateSpeed = 0.5;
        this.cameraControls.panSpeed = 0.8;
        this.cameraControls.enableZoom = false;
        this.cameraControls.enablePan = true;
        this.cameraControls.enableDamping = true;
        this.cameraControls.dampingFactor = 0.3;
        this.cameraControls.keys = [ 65, 83, 68 ];
        this.cameraControls.enabled = true;

        for (let i = 0; i < this.objectQueue.length; i++) {
            this.add(this.objectQueue[i]);
        }
    }

    makeAxis(x: number, y: number, z: number, length: number, width: number, brightness: number) {
        let group = new THREE.Object3D();

        let r = new THREE.Color(0.5, 0.1, 0.1).offsetHSL(0, 0, brightness);
        let g = new THREE.Color(0.1, 0.5, 0.1).offsetHSL(0, 0, brightness);
        let b = new THREE.Color(0.1, 0.1, 0.5).offsetHSL(0, 0, brightness);

        let tickSpacing = 10;
        let tickWidth = 1;

        // red X
        let lmaterial = new THREE.LineBasicMaterial( {color: r.getHex(), linewidth: width});
        let lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(length, 0, 0));
        let line = new THREE.Line(lgeometry, lmaterial);
        line.castShadow = true;
        line.receiveShadow = true;
        group.add(line);
        for (let i = 0; i < length; i += tickSpacing) {
            let lgeometry = new THREE.Geometry();
            lgeometry.vertices.push(new THREE.Vector3(i, -tickWidth, 0));
            lgeometry.vertices.push(new THREE.Vector3(i, tickWidth, 0));
            line = new THREE.Line(lgeometry, lmaterial);
            line.castShadow = true;
            line.receiveShadow = true;
            group.add(line);
        }
        group.name = 'axis:' + x + '-' + y + '-' + z + ':' + length + 'x' + width;

        // green Y
        lmaterial = new THREE.LineBasicMaterial( {color: g.getHex(), linewidth: width} );
        lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(0, length, 0));
        line = new THREE.Line(lgeometry, lmaterial);
        line.castShadow = true;
        line.receiveShadow = true;
        group.add(line);
        for (let i = 0; i < length; i += tickSpacing) {
            let lgeometry = new THREE.Geometry();
            lgeometry.vertices.push(new THREE.Vector3(0, i, -tickWidth));
            lgeometry.vertices.push(new THREE.Vector3(0, i, tickWidth));
            line = new THREE.Line(lgeometry, lmaterial);
            line.castShadow = true;
            line.receiveShadow = true;
            group.add(line);
        }

        // blue Z
        lmaterial = new THREE.LineBasicMaterial( {color: b.getHex(), linewidth: width} );
        lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(0, 0, length));
        line = new THREE.Line(lgeometry, lmaterial);
        line.castShadow = true;
        line.receiveShadow = true;
        group.add(line);
        for (let i = 0; i < length; i += tickSpacing) {
            let lgeometry = new THREE.Geometry();
            lgeometry.vertices.push(new THREE.Vector3(0, -tickWidth, i));
            lgeometry.vertices.push(new THREE.Vector3(0, tickWidth, i));
            line = new THREE.Line(lgeometry, lmaterial);
            line.castShadow = true;
            line.receiveShadow = true;
            group.add(line);
        }

        group.position.x = x;
        group.position.y = y;
        group.position.z = z;

        return group;
    }

    makePixieDots(coords : number[][]) {
        let geometry = new THREE.Geometry();
        for (let j = 0; j < coords.length; j++) {
            let coord = coords[j];
            geometry.vertices.push(new THREE.Vector3(coord[0], coord[1], coord[2]));
        }
        let dotMaterial = new THREE.LineBasicMaterial({
            'color': 0xaf7faf,
            'linewidth': 3
        });
        let dots = new THREE.Line(geometry, dotMaterial);
        dots.userData['type'] = 'trail';
        return dots;
    }

    makeTextSprite( message, parameters, x, y, z ) {

        if (parameters === undefined) { parameters = {}; };

        const fontface = parameters.hasOwnProperty('fontface') ?
            parameters['fontface'] : 'Arial';

        const fontsize = parameters.hasOwnProperty('fontsize') ?
            parameters['fontsize'] : 30;

        const borderThickness = parameters.hasOwnProperty('borderThickness') ?
            parameters['borderThickness'] : 4;

        const borderColour = parameters.hasOwnProperty('borderColour') ?
            parameters['borderColour'] : { r: 0, g: 0, b: 0, a: 1.0 };

        const backgroundColour = parameters.hasOwnProperty('backgroundColour') ?
            parameters['backgroundColour'] : { r: 255, g: 255, b: 255, a: 1.0 };

        const textColour = parameters.hasOwnProperty('textColour') ?
            parameters['textColour'] : { r: 33, g: 33, b: 33, a: 1.0 };

        const noBackground = parameters.hasOwnProperty('noBackground') ?
            parameters['noBackground'] : false;

        const noBorder = parameters.hasOwnProperty('noBorder') ?
            parameters['noBorder'] : false;

        const canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        context.textBaseline = 'top';
        context.font = 1.1 * fontsize + 'px ' + fontface;
        message += ' ';
        const metrics = context.measureText(message);
        const textWidth = metrics.width;
        const textHeight = parseInt(context.font, 10);
        canvas.height = textHeight;
        canvas.width = 1.1 * textWidth;
        context = canvas.getContext('2d');
        context.textBaseline = 'top';
        context.font = fontsize + 'px ' + fontface;

        if (! noBackground) {
            context.fillStyle = this.getCanvasColour(backgroundColour);
            context.fillRect(0, 0, textWidth, textHeight);
        }

        context.fillStyle = this.getCanvasColour(textColour);
        context.fillText(message, 0, 0);
        context.lineWidth = borderThickness;
        context.restore();

        // canvas contents will be used for a texture
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
        const sprite = new THREE.Sprite( spriteMaterial );
        sprite.name = 'label-' + message;
        sprite.scale.set(textWidth, textHeight, 1);
        sprite.position.set(x + textWidth / 2, y - textHeight / 2, z);
        return sprite;
    }

    makeTriangle(p: string, scale: number, colour: string) {
        const v1 = new THREE.Vector3(1, -1, 2);
        const v2 = new THREE.Vector3(1, 1, 2);
        const v3 = new THREE.Vector3(0, 0, 2);

        const geometry = new THREE.Geometry();
        geometry.vertices.push(v1);
        geometry.vertices.push(v2);
        geometry.vertices.push(v3);
        geometry.faces.push(new THREE.Face3(0, 1, 2));
        const material = new THREE.MeshBasicMaterial({color: colour});
        const triangle = new THREE.Mesh(geometry, material);

        switch (p) {
            case 'left':
                break;
            case 'right': triangle.rotation.z = Math.PI;
                break;
            case 'up': triangle.rotation.z = Math.PI / 2;
                break;
            case 'down': triangle.rotation.z = -Math.PI / 2;
                break;
        }
        triangle.scale.set(scale, scale, 1);
        return triangle;
    }

    remove(obj) {
        this.scene.remove(obj);
    }

    removeBackgroundImage() {
        if (this.backgroundObject !== undefined) {
            this.scene.remove(this.backgroundObject);
        }
    }

    removeGroupChildren(name: string) {
        let group = this.scene.getObjectByName(name);
        if (group !== undefined) {
            while (group.children.length)
            {
                    group.remove(group.children[0]);
            }
        }
    }

    removeTextSprite(text: string) {
        let labels:any[] = [];
        let regexp = new RegExp("^label-" + text);

        this.scene.traverse(function(ob) {
            if (ob.name.match(regexp)) {
                labels.push(ob);
            }
        });
        for (let i = 0; i < labels.length; i++) {
            this.scene.remove(labels[i]);
        }
    }

    render() {
        let taskNames = Object.keys(this.tasks);
        for (let i = 0; i < taskNames.length; i++) {
            let task = this.tasks[taskNames[i]];
            task.cb(task.owner);
        }
        this.renderer.render( this.scene, this.camera );
    }


    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
        ctx.stroke();
    }

    setBackgroundColour(c: string) {
        this.renderer.setClearColor(c, 1);
        this.clearColour = c;
    }

    setZoom(v: number) {
        this.camera.zoom = v;
        this.camera.updateProjectionMatrix();
    }

    slideView(x: number, y: number, z: number) {
        let d = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        let dx = x*d - this.camera.position.x;
        let dy = y*d - this.camera.position.y;
        let dz = z*d - this.camera.position.z;
        let steps = 30;

        let siht = this;
        let count = 0;
        let iv = setInterval(function() {
                siht.camera.position.x += dx/steps;
                siht.camera.position.y += dy/steps;
                siht.camera.position.z += dz/steps;
                siht.camera.lookAt(new THREE.Vector3(0,0,0));
                siht.render();
                if (++count === steps) {
                    clearInterval(iv);
                }

            }, 50);
    }

    viewFrom(x: number, y: number, z: number) {
        this.slideView(x, y, z);
        return;
    }

    zoom(amt: number) {
        this.camera.zoom += amt;
        this.camera.updateProjectionMatrix();
    }

}
