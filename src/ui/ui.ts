import { Options, CSSNamespace, Direction, Orientation, TickLabel, Dimensions } from '../core/types';
import { _valOrFunc, _round, _clamp } from '../core/funcs';
import { WebenomicCore } from '../core/util';
import { Tooltip } from './tooltip';
import { TickMarks } from './tick_marks';
import { TickLabels } from './tick_labels';
import { Handle } from './handle';
import { Events } from './events';

const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
declare global {
    interface Element {
        rect(): DOMRect;
    }

    interface HTMLElement {
        hide(): void;
        show(): void;
    }
}

HTMLElement.prototype.hide = function() { this.style.display = 'none' };
HTMLElement.prototype.show = function() { this.style.display = 'block' };
Element.prototype.rect = function() { return this.getBoundingClientRect(); };
        
export class SliderUI {
    
    parent: HTMLElement;
    config: Options;
    slider: any;
    
    direction: Direction;
    orientation: Orientation;
    vertical: boolean;
    progressElem: HTMLInputElement;
    ribbon: HTMLElement;
    tooltip: HTMLElement;
    container: HTMLElement;
    handle: HTMLElement;
    handleLabel: HTMLElement;
    steps: number[];
    
    tickLabels: Element[];
    tickLabelClass: TickLabels;
    tickMarks: Element[];
    tickMarkClass: TickMarks;
    markSteps: number[];
    tickOn: number | null;
    tickVal: any;
    
    handleClass: Handle;
    
    startCap: HTMLElement | null;
    endCap: HTMLElement | null;
    uiCreated: Promise<any>;
    uiReady: boolean;
    dimensions: Dimensions | null;
    
    /** alias methods from associated classes */
    _updateTicks(val: number) {
        return this.tickLabelClass._updateTicks(val);
    }
    
    _updateHandle(val: number) {
        return this.handleClass._updateHandle(val);
    }
    
    _updateValue(val: number, wbnVal: number) {
        return new Promise((res) => {
            this.slider._updateValue(val, wbnVal)
            res(this);
        });
    }
        
    _wbnValToProgVal(wbnVal: number) {
        return this.slider._wbnValToProgVal(wbnVal);
    }
    _updateBindings() {
        return this.slider._updateBindings();
    }
    /** end alias methods **/   
    
    constructor(parent: any, config: Options, slider: any) {

        Object.assign(this,{
            slider: slider,
            config: config,
            parent: parent,
            uiReady: false
        });

         this.uiCreated = new Promise((res,rej) => {
            this._createElements()
            .then(() => {
                this._assignAttributes()
            }).then(() => {
                this._createSteps()
            }).then(() => {
                this.handleClass = new Handle(this,config);
            }).then(() => {
                this.tickLabelClass = new TickLabels(this,config);
            }).then(() => {
                this.tickMarkClass = new TickMarks(this,config);
            }).then(() => {
                new Tooltip(this,config);
            }).then(() => {
                this._createCaps()
            }).then(() => {
                new Events(this,config);
            }).then(() => {
                this._refreshUI()
            }).then(() => {
                this._responsiveUI()
            }).then(() => {
                this.dimensions = this._dimensions();
                this.uiReady = true;
            });
            res(this);

        });
        return this;
    } 
    
    /* public method to redraw UI, post-initialization */
    update() {
        this._assignAttributes()
            .then(() => this._createSteps())
            .then(() => this._refreshUI());
        return this;
    }
    
    /* DOM dimensions for all SliderUI components, caches in this.dimenions by default for better performance */
    _dimensions(recalibrate?: boolean | false) {
        if (this.dimensions && !recalibrate) return this.dimensions; 
        
        const parentDimension = (prop: string) => { return parseInt(window.getComputedStyle(this.parent, null).getPropertyValue(prop)) };
        
        const { config, container, progressElem, vertical, direction } = this;
        const parentHeight = parentDimension('height'); 
        const parentWidth = parentDimension('width'); 
        const containerRect = container.rect();
        const progressRect = progressElem.rect();
        const progressLength =  progressRect[vertical ? 'height' : 'width'];
        const progressThickness = progressRect[vertical ? 'width' : 'height'];
        const progressOffset = progressElem[vertical ? 'offsetTop' : 'offsetLeft'];
        const positionProperty  = vertical ? 'top' : 'left'
        const positionOffsetProperty = vertical ? 'offsetLeft' : 'offsetTop';
        const thicknessProperty  = vertical ? 'width' : 'height'
        const directionAlias = vertical ? (direction == 'up' ? 'left' : 'right') : direction;
        
        return {
            parentHeight: parentHeight,
            parentWidth: parentWidth,
            containerRect: containerRect,
            height: config.bar.thickness,
            progressRect: progressRect,
            progressLeft: progressRect.left,
            progressTop: progressRect.top,
            progressBottom: progressRect.bottom,
            progressRight: progressRect.right,
            progressLength: progressLength,
            progressThickness:progressThickness,
            progressOffset: progressOffset,
            positionProperty: positionProperty,
            positionOffsetProperty: positionOffsetProperty,
            thicknessProperty: thicknessProperty,
            directionAlias: directionAlias,
            defaultValue: config.defaultValue
        }
    }
    
    /* create core DOM elements */
    _createElements() {
        return new Promise((res) => {
            
            const { config } = this;
            
            /* create container */
            this.container = __wbn$().create('div',true).setAttr('tabindex','0').elem;
            this.parent.appendChild(this.container);
            this.orientation = config.orientation;
            this.vertical = this.orientation === 'vertical';
            const containerClass = this.container.classList;
            [`${CSSNamespace}container`,this.orientation].forEach((className) => { containerClass.add(className); }); 
            
            /* CSS-specific left-right/up-down direction */
            this.direction = config.direction;
            const directionToCSS = {
                'left':'rtl',
                'down':'ltr',
                'right':'ltr',
                'up':'rtl'
            }
            
            /* create <progress/> polyfill element */
            const parentHeight = parseInt(window.getComputedStyle(this.parent, null).getPropertyValue('height')); 
            const _progressElem = __wbn$().create('progress', true)
                                          .setClass(`${CSSNamespace}slider`)
                                          .setAttr('value', config.defaultValue.toString())
                                          .setAttr('tabindex', '0')
                                          .setStyle({
                                                direction:directionToCSS[this.direction],
                                                width:this.vertical ? parentHeight : 'inherit'
                                          })
                                          .elem;
                                          
                                          
            if (this.vertical) _progressElem.style.marginLeft = config.bar.thickness/2;
            this.container.appendChild(_progressElem);
    
            /* create ribbon for secondary progress */
            const _ribbonElem = __wbn$().create('div',true).setClass(`${CSSNamespace}ribbon`).elem;
            this.container.appendChild(_ribbonElem);
            
            /* create handle & handle label */
            var handle = config.handle;
            const _handleElem = __wbn$().create('div', true)
                                        .setClass(`${CSSNamespace}handle ${handle.className || ''}`)
                                        .elem;
            
            const _handleLabelElem = __wbn$().create('div', true)
                                             .setClass(`${CSSNamespace}handle_label`)
                                             .elem;
                _handleElem.appendChild(_handleLabelElem);
           
            this.container.appendChild(_handleElem);
            
            /* elements into class */
            Object.assign(this, {
                container: this.container,
                progressElem: _progressElem,
                ribbon:_ribbonElem,
                handle: _handleElem,
                handleLabel: _handleLabelElem
            });
            
            res(this);
        });
       
    }
    
    /* assign attributes and polyfill <progress/> CSS variables */ 
    _assignAttributes() {
        return new Promise((res) => {
            const { height } = this._dimensions();
            const { config, slider, config: { range: {min, max}}} = this;
            
            __wbn$(this.progressElem)
                .setStyle({ 'height': height })
                .setAttr('min', '0')
                .setAttr('max', '100')
                .setAttr('wbn-min', min.toString())
                .setAttr('wbn-max', max.toString());
            
            var cssVars = {
              '--background-color':[this.progressElem,config.bar.backgroundColor],
              '--ribbon-color':[this.progressElem,config.ribbon.color || config.handle.color],
              '--handle-color':[this.handle,config.handle.color],
              '--hover-ribbon-color':[this.container,config.ribbon.hoverColor || config.ribbon.color || null],
              '--hover-handle-color':[this.container,config.handle.hoverColor || config.ribbon.hoverColor || config.handle.color || null],
              '--border-radius':[this.progressElem,`${config.bar.borderRadius}px`]
            };
           
            
            for (const [key, [ele,value]] of Object.entries(cssVars)) {
                var thisValue = value;
                if (typeof thisValue === 'function') {
                    thisValue = thisValue(this.slider);
                }
                if (value && ele) ele['style'].setProperty(key,`${thisValue}`);
            }
            
            (config.handle.show !== true) ? __wbn$(this.handle).hide() : __wbn$(this.handle).show();
            (config.ribbon.show !== true) ? this.progressElem.classList.add('hidden_ribbon') : this.progressElem.classList.remove('hidden_ribbon');
            
            return res(this);
        });
    }
    
    /** create array of values according to range steps */
    _createSteps() {
        return new Promise((res) => {
            
            const {config: { ticks: { labels }, range: { min, max, step, decimals }}} = this;
    
            const tickLabels = labels;
            const tickData = tickLabels.data;
    
            if (tickData.length == 0 || tickLabels.snap === false) {
    
                var increment = 1;
                var stepVal = (typeof step === 'function') ? step(increment) : step;
    
                var steps: number[] = [];
                steps[0] = min;
    
                for (let i: number = min; i <= max; i += (typeof step === 'function') ? 1 : stepVal) {
                    var newStep = (typeof step === 'function') ? step(increment) : i;
                    steps.push(_round(newStep, decimals));
                    increment += 1;
                }
                steps.push(max);
    
            } else {
                steps = tickData.map((tick: any) => { return tick.value; });
            }
            
            this.steps = steps;
            return res(this);
        });
    }
    
    /** positioning for tick labels and tick marks */
    _tickPoint(ele: Element,val: number,position: number) {
        const { vertical, progressElem, config: { range: { min, max } } } = this;
        const { progressLength, progressOffset, directionAlias, progressThickness, positionOffsetProperty } = this._dimensions(true);
        const shim = vertical ? progressThickness/2 : 0;
        const tickPointsX = {
            'right': ((val - min) * progressLength / (max - min) + progressOffset) + shim,
            'left': ((max - val) * progressLength / (max - min) + progressOffset) + shim
        };
        const tickThickness = ele.rect()[this.vertical ? 'height' : 'width'];
        const tickLength    = ele.rect()[this.vertical ? 'width' : 'height'];
        const tickPointX = tickPointsX[directionAlias] - tickThickness/2;
        
        var tickPointY = progressElem[positionOffsetProperty] + (vertical ? 0 : (progressThickness / 2)) - tickLength / 2;
        tickPointY += position;

        return [tickPointX, tickPointY];
    }
    
    /** positioning for handle and tooltips */
    _centerPoint(ele: Element,val: number,position: number) {
         const { progressLength,progressOffset,directionAlias,progressThickness } = this._dimensions(true);
         const shim = this.vertical ? (progressThickness/2) : 0;
         const eleWidth = ele.rect()[this.vertical ? 'height' : 'width'];
         const eleHeight = ele.rect()[this.vertical ? 'width' : 'height']
         const xPoints = {
             'right':(progressOffset - eleWidth/2 + _clamp(val / 100, 0, 1) * progressLength) + shim,
             'left':((progressOffset + progressLength) - eleWidth/2 - _clamp(val / 100, 0, 1) * progressLength) + shim,
         }
         const yPoint = {
             'top': xPoints[directionAlias] + progressThickness/2 - eleHeight/2 + position
         }
         return [xPoints[directionAlias],yPoint['top']];
    }
    
    _createCaps() {
        return new Promise((res) => {
            
            const { caps: {startCap,endCap} } = this.config;
            if (!startCap && !endCap) res(this);
            
            const { slider, vertical, direction, progressElem } = this;
            const { positionProperty, progressRect, progressThickness, positionOffsetProperty } = this._dimensions();
            
            const capProps =  {
                    'up' : ['top','bottom'],
                    'down' : ['bottom','top'],
                    'right' : ['left','right'],
                    'left': ['right','left'] 
            };
            
            let [thisStartCap,thisEndCap] = vertical ? [endCap,startCap] : [startCap,endCap];    
            [thisStartCap, thisEndCap].forEach((capConfig, i) => {
                
                if (!capConfig) {     
                    i == 0 ? [this.startCap = null] : [this.endCap == null];
                    return;
                }
                
                const capObj = i == 0 ? 
                {
                    prop: capProps[direction][0],
                    desc: 'start'
                } : {
                    prop: capProps[direction][1],
                    desc: 'end'
                };
                
                const _capStyle = _valOrFunc(capConfig.style,[slider,slider.value],{}); 
                const _capElement = __wbn$().create('div',true)
                                    .setClass(`${CSSNamespace}cap ${capObj.desc} ${capConfig.className || ''}`)
                                    .setStyle(_capStyle)
                                    .html(capConfig.label.text)
                                    .elem;
                                                
                this.parent.appendChild(_capElement);
                _capElement.style[positionProperty] = progressRect[capObj.prop];
                _capElement.style[vertical ? 'left' : 'top'] = progressElem[positionOffsetProperty] + (vertical ? 0 : progressThickness/2) - (_capElement.rect()[vertical ? 'width' : 'height']/2)
    
                i == 0 ? [this.startCap = _capElement] : [this.endCap = _capElement];
                
            });
            
            //this._constrainContainer();
            res(this);
        });
    }
    
    /* refresh elements with resizing and dynamic callbacks **/
    _refreshUI() {
        
        const { progressBottom,progressRight,positionProperty } = this._dimensions();
        const {vertical,progressElem,slider: { config: { ticks }}} = this;
        const tickLabelData = ticks.labels.data;

        const progressValue = Number(progressElem.value);
        
        this._constrainContainer();
        
        this.tickLabels.forEach((tick, i) => {
            const labelValue = tickLabelData[i] ? tickLabelData[i].value : tick
            this.tickLabelClass._positionTickLabel(tick, labelValue, tickLabelData[i], i);
        });

        this.tickMarks.forEach((markEle,i) => {
            this.tickMarkClass._positionTickMark(markEle,this.markSteps[i]);
        });
        
        var endCap = this.direction == 'down' || this.direction == 'left' ? this.startCap : this.endCap;
        if (endCap) {
            endCap.style[positionProperty] = vertical ? progressBottom : progressRight;
        }
        
        this._responsiveUI()._updateHandle(progressValue);

        return this;
       
    }
    
    /* change DOM constraints and re-dimension elements as dynamic callbacks redraw UI **/
    _constrainContainer() {
        const { containerRect, parentHeight, parentWidth, progressThickness } = this._dimensions(true);
        const { tickLabels, startCap, endCap, vertical, tickMarks, progressElem } = this;
        
        const container = __wbn$(this.container).elem;
        
        var boundaries = {
            'start': vertical ? 'top' : 'left',
            'end': vertical ? 'bottom' : 'right'
        };
        
        const getBounds = (ele: any) => [boundaries.start,boundaries.end].map((key) => { return ele ? ele[key] : null });
        
        let [boundaryStart,boundaryEnd] = getBounds(containerRect);
        tickLabels.concat(tickMarks).forEach((tick: any) => {
            let [tickStart,tickEnd] = getBounds(tick); 
            boundaryStart = tickStart < boundaryStart ? tickStart : boundaryStart;
            boundaryEnd = tickEnd > boundaryEnd ? tickEnd : boundaryEnd; 
        });
        
       boundaryStart = containerRect[boundaries.start] - boundaryStart;
       boundaryEnd = boundaryEnd - containerRect[boundaries.end];
       
       const capProp = vertical ? 'height' : 'width';
       const capStart = (startCap ? startCap.rect()[capProp] : 0);
       const capEnd = (endCap ? endCap.rect()[capProp] : 0);
       const capTotal = capStart+capEnd;

       __wbn$(container).setStyle(vertical ? {
           height: parentHeight - (boundaryEnd) - (boundaryStart) - capTotal,
           marginTop: -(progressThickness/2) + boundaryStart + capStart
        } : {
           width: parentWidth - (boundaryEnd) - (boundaryStart) - capTotal,
           marginLeft: boundaryStart + capStart
        });
        
        if (vertical) {
            __wbn$(progressElem).setStyle({
                width: parentHeight - (boundaryEnd) - (boundaryStart) - capTotal,
            }) 
        }
    }
    
    /* hide granular elements that visually collide as responsive resizing requires */
    _responsiveUI() {
        
        const { config: { responsive }, orientation, direction, tickLabels, tickMarks } = this;
        
        if (responsive === false) return this;

        var lastRect: any;
        let outOfBounds = (tickRect: any) => {
            if (orientation == 'horizontal')
                return (direction == 'right' ? tickRect.left <= lastRect.right : tickRect.right >= lastRect.left)
            else
                return (direction == 'down' ? tickRect.bottom <= lastRect.top : tickRect.top >= lastRect.bottom)  
         };
        
        const tickGroups = [tickLabels,tickMarks];
        
        tickGroups.forEach((tickGroup) => {
            lastRect = null;
            tickGroup.forEach((tick:any) => {
                var tickRect = tick.rect();
                __wbn$(tick).setStyle({ visibility: (lastRect && outOfBounds(tickRect)) ? 'hidden' : 'visible' });
                if (__wbn$(tick).getStyle('visibility') != 'hidden') lastRect = tickRect;
            });
        });
        return this;
    }

    
    /* convert 1-100 <progress/> polyfill to actual slider value */
    _progValToWbnVal(progVal: number): number {
        const { config: { range: { min, max, decimals }}} = this;
        return _round(_clamp(min + ((max - min) * progVal / 100), min, max), decimals);
    }
    
    /* conform actual slider value to nearest step */
    _wbnValToStep(wbnVal: number): number {
        const steps = this.steps;
        var diff = Math.abs(Number(steps[0]) - wbnVal);
        var stepIndex = 0;
        steps.forEach((step, i) => {

            var thisDiff = Math.abs(step - wbnVal);
            if (thisDiff < diff) {
                diff = thisDiff;
                stepIndex = i;
            }
        });
        return steps[stepIndex];
    }
    
    /* destroy UI */
    _destroyElements() {
        
        const { progressElem, handle, tickLabels, tickMarks } = this;
        [progressElem,handle,...tickLabels,...tickMarks].forEach((ele) => {
            ele.remove(); 
        });
        this.steps = [];
        
    }
    
    
    

}
    
