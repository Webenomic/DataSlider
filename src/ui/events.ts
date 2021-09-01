import { Options, CSSNamespace } from './../core/types';
import {WebenomicCore} from './../core/util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

export class Events {
    
    ui: any;
    config: Options;
    focused: boolean;
    progressDrag: boolean;
    
    constructor(ui: any, config: Options) {
        this.ui = ui;
        this.config = config;
        this.focused = false,
        this._assignEvents();
        return ui;
    }    
    
    /* create mouse/keyboard event handlers and delegate to elements, add-in callbacks */
    _assignEvents() {
        return new Promise((res) => {         

            
            const { slider, config, tickLabels, container, handle, progressElem, direction, config: { range: { min, max }} } = this.ui;
            const supportsTouch = window.supportsTouch(); 

            __wbn$(container).on([ supportsTouch ? 'touchstart' : 'mousedown'], (e) => {
                const { tickVal } = this.ui;
                if (tickVal) {
                    slider.update(tickVal);
                    return;
                }
                document.body.classList.add(`${CSSNamespace}select_disabled`);
                config.onDragStart(slider,slider.value);
                this.progressDrag = true;
                this._updateProgress(e);
                config.onDrag(slider,slider.value);
            }).on([supportsTouch ? 'touchmove' : 'mousemove'], (e) => {
                this._updateProgress(e);
                this.ui.config.onDrag(slider,slider.value);
            },{passive:false});
            
            __wbn$(document).on([supportsTouch ? 'touchend' : 'mouseup'], (e) => { 
                if(this.progressDrag) config.onDragEnd(slider,slider.value); 
                this.progressDrag = false;
                document.body.classList.remove(`${CSSNamespace}select_disabled`); 
            });
            
            document.addEventListener('mousemove', (e) => { 
                this._updateProgress(e)
                    .then(() => { config.onDrag(slider) }); 
            });
            
            if (config.arrowKeys) {
                const arrowKeyCodes = {
                    'right': { 37: -1, 39: 1},
                    'left': { 37: 1, 39: -1},
                    'up': {38: 1, 40: -1},
                    'down':{38: -1, 40: 1}
                }
                
                const focusElements = tickLabels.concat([container, handle, progressElem]);
                focusElements.forEach((elem) => {
                    elem.addEventListener('focus',(e) => {
                        this.focused = true; 
                    });
                    elem.addEventListener('blur',(e) => {
                        this.focused = false; 
                    });
                });
                
                 document.addEventListener('keydown', (e) => {
                    var increment = arrowKeyCodes[direction][e.which];
                    if (increment && this.focused) {
                        if (e.shiftKey) increment *= 5;
                        const newValue = Number(slider.value) + (increment * Number(config.range.step));
                        slider.update(newValue);
                    }    
                });
            }
            
            document.querySelectorAll('input[wbn-bind]').forEach((ele: any) => {
                var eleBindVarName = ele.getAttribute('wbn-bind');
                var changeFunc = () => { window.wbnScope[eleBindVarName] = ele.value; };
                ele.addEventListener('change', changeFunc);
                ele.addEventListener('keyup', changeFunc);
                ele.addEventListener('blur', () => {
                    if (ele.value > max) ele.value = max;
                    if (ele.value < min) ele.value = min;
                });
            });
    
            window.addEventListener('resize', (e) => { this.ui._refreshUI(); });
            res(this);
        });
    }
    
    /* global event endpoint for updating slider value */
    _updateProgress(e: any, tickPos?: number) {
        return new Promise((res) => {
            if (!this.progressDrag && !tickPos && e.touches === undefined) return;
            const { vertical } = this.ui;
            const { progressTop, progressLeft,progressBottom,progressRight,progressLength,directionAlias } = this.ui._dimensions(true);
            const posProperty = vertical ? 'clientY' : 'clientX';
            const clientPos = e ? e[posProperty] || e.touches[0][posProperty] : tickPos;
            
            const progressVal = {
                'right':(clientPos - (vertical ? progressTop : progressLeft)) / progressLength * 100,
                'left':((vertical ? progressBottom : progressRight) - clientPos) / progressLength * 100
            }
            
            var wbnVal = this.ui._wbnValToStep(this.ui._progValToWbnVal(progressVal[directionAlias]));
            const newVal = this.ui._wbnValToProgVal(wbnVal);
            
            this.ui._updateValue(newVal, wbnVal)
                .then(() => { this.ui._updateBindings() })
            res(this);
        });   
    }
    
}