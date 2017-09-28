import { ElementRef, Injectable } from '@angular/core';
import * as THREE from 'three';
//import { OrbitControls } from 'three-orbitcontrols-ts';
declare const require: (moduleId: string) => any;
var ExtraControls = require('three-orbitcontrols');
declare var Stats: any;

import {PeriodicService} from '../periodic.service';

@Injectable()
export class ThreedService {

    backgroundObject: any = undefined;
    camera = undefined;
    cameraControls = undefined;
    clearColour = '#d0d0d0';
    element = undefined;
    raycaster = undefined;
    renderer = undefined;
    scene = undefined;
    sizeX: number = undefined;
    sizeY: number = undefined;
    stats: any = undefined;

    constructor(private periodicService: PeriodicService) { }

    initialiseThree(sizeX: number, sizeY: number, element: ElementRef) {
        this.stats = [new Stats(), new Stats(), new Stats()];
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
        this.scene.add(obj);
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
        light.position.set(50, 50, 50);
        light.position.multiplyScalar(1.3);

        light.castShadow = true;
        light.shadowCameraVisible = true;

        light.shadowMapWidth = 512;
        light.shadowMapHeight = 512;

        const d = 1000;
        light.shadowCameraLeft = -d;
        light.shadowCameraRight = d;
        light.shadowCameraTop = d;
        light.shadowCameraBottom = -d;

        light.shadowCameraFar = 1000;
        light.shadowDarkness = 0.8;
        light.target = lightTarget;
        this.scene.add(light);
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
        this.camera.position.x =  1000;
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

    render() {
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

    zoom(amt: number) {
        this.camera.zoom += amt;
        this.camera.updateProjectionMatrix();
    }

}
