import { Directive, HostListener, OnInit, ElementRef, Input, Output } from '@angular/core';
import {ThreedService} from './threed/threed.service';

@Directive({
  selector: '[appThreed]',
})
export class ThreedDirective implements OnInit {

    @Input('displaywidth') displaywidth = 1024;
    @Input('displayheight') displayheight = 768;

    @HostListener('mousemove', ['$event'])
      onMousemove(event) { this.mouseMoveHandler(event); };

    @HostListener('mousedown', ['$event'])
      onMousedown(event) { this.mouseDownHandler(event); };

    @HostListener('mouseup', ['$event'])
      onMouseup(event) { this.mouseUpHandler(event); };

    @HostListener('mousewheel', ['$event'])
      onMousewheel(event) { this.mouseWheelHandler(event); };



    constructor(private el: ElementRef, private threeService: ThreedService) {
        this.threeService = threeService;
    }

    ngOnInit() {
        this.threeService.initialiseThree(this.displaywidth, this.displayheight, this.el);
    }


    mouseDownHandler(event) {

        /*this.mouse.x = -1 + 2 * (event.offsetX / event.srcElement.width);
        this.mouse.y = 1 - 2 * (event.offsetY / event.srcElement.height);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        var limbs = [];
        this.scene.traverse(function(ob) {
            if (ob.name.match(/biot-node/))
            limbs.push(ob);
        });
        var intersects = this.raycaster.intersectObjects(limbs);

        if (intersects.length > 0) {
            this.cameraControls.enabled = false;
            for (var i = 0; i < intersects.length; i++) {
                var limb = intersects[i].object;
                if (limb.userData.address) {
                    this.selectedLimb = limb;            
                    this.currentLimb = limb;            
                    this.selectedLimb.userData['currentX'] = this.selectedLimb.position.x;
                    this.selectedLimb.userData['currentY'] = this.selectedLimb.position.y;
                    this.selectedLimb.userData['currentZ'] = this.selectedLimb.position.z;
                    break;
                }
            }
        } else {
            this.cameraControls.enabled = true;
        }*/
        //this.threeService.cameraControls.enabled = true;
    }


    mouseMoveHandler(event) {

        /*this.mouse.x = -1 + 2 * (event.offsetX / event.srcElement.width);
        this.mouse.y = 1 - 2 * (event.offsetY / event.srcElement.height);

        if (this.selectedLimb) {
            if (this.selectedLimb) {
                this.raycaster.setFromCamera(this.mouse, this.camera);
                var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), this.selectedLimb.position.y);
                var hitPoint = this.raycaster.ray.intersectPlane(plane);
                if (hitPoint) {
                    this.selectedLimb.position.x = hitPoint.x;
                    this.selectedLimb.position.y = hitPoint.y;
                    this.selectedLimb.position.z = hitPoint.z;
                } else {
                    this.selectedLimb = undefined;
                }
            }
        }*/
    }

    mouseUpHandler(event) {
        /*if (this.selectedLimb) {
            if ((this.selectedLimb.position.x == this.selectedLimb.userData['currentX']) &&
                (this.selectedLimb.position.y == this.selectedLimb.userData['currentY']) &&
                (this.selectedLimb.position.z == this.selectedLimb.userData['currentZ'])) {
                this.openNodeDialog(this.selectedLimb);
            } else if (this.selectedLimb.userData['parent']) {
                this.selectedLimb.position.x = this.selectedLimb.userData['currentX'];
                this.selectedLimb.position.y = this.selectedLimb.userData['currentY'];
                this.selectedLimb.position.z = this.selectedLimb.userData['currentZ'];
            }
            this.selectedLimb = undefined;
            this.cameraControls.enabled = false;
        }*/
        //this.threeService.cameraControls.enabled = false;
    }

    mouseWheelHandler(event) {
        event.preventDefault();
        event.stopPropagation();
        var amount = event.wheelDelta;
        var delta = 0.1;
        if (amount < 0)
            delta = -0.1;
        this.threeService.zoom(delta);
    }


}
