import { Options, CSSNamespace, Cap } from './../core/types';
import {WebenomicCore} from './../core/util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
import { _valOrFunc } from './../core/funcs';

interface CapObj {
    capElem: HTMLElement,
    capConfig: Cap,
    capType: string
}

export class Caps {
    
    ui: any;
    config: Options;
    
    constructor(ui: any, config: Options) {
        this.ui = ui;
        this.config = config;
        return this;
    }

    /* cap creation is separated into 2 (redundant) methods, for better DOM flow of caps around core container */
    _createStartCap() {
        const { vertical, config: { caps: { startCap: startConfig, endCap: endConfig }}} = this.ui;
        const thisConfig = vertical ? endConfig : startConfig;
        if (!thisConfig) return;
        this.ui.startCap = this._createCap(thisConfig,'start');
        
    }    
    
    _createEndCap() {
        const { vertical, config: { caps: { startCap: startConfig, endCap: endConfig }}} = this.ui;
        const thisConfig = vertical ? startConfig : endConfig;
        if (!thisConfig) return;
        this.ui.endCap = this._createCap(thisConfig,'end');
        
    }
    
    _createCap(capConfig: any, capType: string) {  
        const { direction, parent, config } = this.ui;
        const capProps =  {
                'up' : ['top','bottom'],
                'down' : ['bottom','top'],
                'right' : ['left','right'],
                'left': ['right','left'] 
        };
        const capObj = 
        {
            prop: capProps[direction][capType == 'start' ? 0 : 1],
            desc: capType
        };
        
        

        const _capElement = __wbn$().create('div',true)
                    .setClass(`${CSSNamespace}cap ${capObj.desc} ${capConfig.className || ''}`)
                    .elem;
        parent.appendChild(_capElement);
        return _capElement;
    }
    
    _updateCaps(val?: number) {
        const { vertical, direction, startCap, endCap, slider, config: { caps: { startCap: startConfig, endCap: endConfig }}} = this.ui;
        
        const rtl = vertical && direction === 'up' || direction == 'left';
        
        [[rtl ? endCap : startCap,rtl ? endConfig : startConfig,'start'],[rtl ? startCap : endCap,rtl ? startConfig : endConfig,'end']].forEach((capArray) => {
            
            const capObj: CapObj = {
                capElem: capArray[0],
                capConfig: capArray[1],
                capType: capArray[2]
            }
            
            if (!capObj.capElem) return;
            const _capLabel = capObj.capConfig.label;
            const _capStyle = _valOrFunc(_capLabel.style,[slider,slider.value],{});
            const _capText  = _valOrFunc(_capLabel.text,[slider,slider.value],'');
            __wbn$(capObj.capElem).setStyle(_capStyle).html(_capText);
            
            this._positionCap(capObj);
        
        });
        return this.ui;
 
    }
    
    _positionCap(capObj: CapObj) {
        const { vertical,progressElem,container } = this.ui;
        const { positionProperty, progressRect, progressThickness, positionOffsetProperty, containerRect } = this.ui._dimensions(true);
        
        const capProp = capObj.capType == 'end' ? (vertical ? 'top' : 'right') : (vertical ? 'bottom' : 'left');
        const capOffset = capObj.capElem.rect()[vertical ? 'height' : 'width'];
        const capPos = container[vertical ? 'offsetTop' : 'offsetLeft']  + (capObj.capType === 'end' ? progressRect[vertical ? 'height' : 'width']  : -capOffset); 
         
        capObj.capElem.style[vertical ? 'top' : 'left'] = `${capPos}px`;
        capObj.capElem.style[vertical ? 'left' : 'top'] = `${progressElem[positionOffsetProperty] + (vertical ? 0 : progressThickness/2) - (capObj.capElem.rect()[vertical ? 'width' : 'height']/2)}px`;
        
    }
}