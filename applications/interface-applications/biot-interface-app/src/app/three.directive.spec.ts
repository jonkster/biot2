import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { ThreeDirective } from './three.directive';


describe('ThreeDirective', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ThreeDirective
            ],
        });
    });

    var holder = document.createElement('div');
    var ref = new ElementRef(holder);
    var directive = new ThreeDirective(ref);
    var objectCount = 0;

    var getSceneNames = function() {
        var sceneObjects = [];
        for (var i = 0; i < directive.scene.children.length; i++) {
            if (directive.scene.children[i].name !== '') {
                sceneObjects.push(directive.scene.children[i].name);
            }
        }
        return sceneObjects;
    }

    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('init method should create a canvas element', () => {
        directive.init();
        expect(ref.nativeElement.querySelector('canvas').toBeTruthy);
        console.log(directive.scene.children.length);
    });

    it('directive instance should have a camera', () => {
        expect(directive.cameraControls.object.type).toMatch(/Camera/);
    });

    it('directive instance should have a scene', () => {
        expect(directive.scene.visible).toBeTruthy();
    });

    it('the scene should have several children', () => {
        objectCount = directive.scene.children.length;
        expect(objectCount).toBeGreaterThan(3);
    });

    it('the scene should have a world axis', () => {
        expect(getSceneNames()).toContain('world-axis-');
    });

    it('the scene should have ambient light', () => {
        expect(getSceneNames()).toContain('AmbientLight');
    });

    it('the scene should have a point light', () => {
        expect(getSceneNames()).toContain('pointlight');
    });

    it('the scene should have a hemi light', () => {
        expect(getSceneNames()).toContain('hemilight');
    });

    it('the scene should have a floor', () => {
        expect(getSceneNames()).toContain('scene-floor');
    });

    it('the scene should have a north label', () => {
        expect(getSceneNames()).toContain('label-North');
    });

    it('the scene should have a east label', () => {
        expect(getSceneNames()).toContain('label-East');
    });

    it('the scene should have a south label', () => {
        expect(getSceneNames()).toContain('label-South');
    });

    it('the scene should have a west label', () => {
        expect(getSceneNames()).toContain('label-West');
    });

    it('the scene should have an up label', () => {
        expect(getSceneNames()).toContain('label-Up');
    });

    it('the scene should have a down label', () => {
        expect(getSceneNames()).toContain('label-Down');
    });


    it('the directive will add nodes when requested', () => {
        directive.addNode(null, 'test-node', 0, 0, 0, '#7f7f7f', 'test-node-name2', 10, true);
        expect(directive.scene.children.length).toEqual(objectCount+1);
        expect(directive.scene.children[objectCount].name).toEqual('biot-node-test-node');
    });


});
