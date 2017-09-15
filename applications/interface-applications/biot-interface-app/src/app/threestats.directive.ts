import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import {ThreedService} from './threed/threed.service';

@Directive({
  selector: '[appThreestats]'
})
export class ThreestatsDirective implements OnInit  {
    @Input() statsstyle: any = {};

    constructor(private el: ElementRef, private threeService: ThreedService) {
        this.threeService = threeService;
    }

    ngOnInit() {
        let widget = this.threeService.getStats();
        this.el.nativeElement.appendChild(widget[0].dom);
        this.el.nativeElement.appendChild(widget[1].dom);
        this.el.nativeElement.appendChild(widget[2].dom);
        let attribs = Object.keys(this.statsstyle);
        for (let i = 0; i < attribs.length; i++) {
            let attrib = attribs[i];
            widget[0].dom.style[attrib] = this.statsstyle[attrib];
            widget[1].dom.style[attrib] = this.statsstyle[attrib];
            widget[2].dom.style[attrib] = this.statsstyle[attrib];
        }
    }

}
