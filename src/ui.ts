import { Options, CSSNamespace, Direction, Orientation,TickLabel } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
declare global {
    interface Element {
        rect(): DOMRect;
    }
}

declare global {
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
    focused: boolean;
    steps: number[];
    tickLabels: Element[];
    tickMarks: Element[];
    markSteps: number[];
    tickOn: number | null;
    tickVal: any;
    startCap: HTMLElement | null;
    endCap: HTMLElement | null;
    progressDrag: boolean;
    uiCreated: Promise<any>;
    uiReady: boolean;
    uiDimen: object;

    constructor(parent: any, config: Options, slider: any) {

        
        Object.assign(this,{
            slider: slider,
            config: config,
            parent: parent,
            focused: false,
            uiReady: false,
            tickLabels: [],
            steps: []
        });

         this.uiCreated = new Promise((res,rej) => {

            this._createElements()
            .then(() => {
                this._assignAttributes()
            }).then(() => {
                this._createSteps()
            }).then(() => {
                this._createTickLabels()
            }).then(() => {
                this._createCaps()
            }).then(() => {
                this._createTickMarks()
            }).then(() => {
                this._createTooltip()
            }).then(() => {
                this._assignEvents()
            }).then(() => {
                this._refreshUI()
            }).then(() => {
                this._responsiveUI()
            }).then(() => {
                this.uiDimen = this.UI();
                this.uiReady = true;
            });
            res(this);

        });
        return this;
    }
    
    UI() {
        
        const parentDimension = (prop) => { return parseInt(window.getComputedStyle(this.parent, null).getPropertyValue(prop)) };
        
        const {config,container,progressElem,vertical,direction} = this;
        const parentHeight = parentDimension('height'); 
        const parentWidth = parentDimension('width'); 
        const containerRect = container.rect();
        const progressRect = progressElem.rect();
        const progressLeft = progressRect.left;
        const progressTop = progressRect.top;
        const progressBottom = progressRect.bottom;
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
            progressDrag: this.progressDrag,
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
            min: config.range.min,
            max: config.range.max,
            step: config.range.step,
            decimals: config.range.decimals,
            defaultValue: config.defaultValue
        }
    }

    _destroy() {
        
        const {progressElem,handle,tickLabels,tickMarks} = this;
        [progressElem,handle,...tickLabels,...tickMarks].forEach((ele) => {
            ele.remove(); 
        });
        this.steps = [];
        
    }

    _createElements() {
        return new Promise((res) => {
            
            this.container = __wbn$().create('div',true).setAttr('tabindex','0').elem;
            this.parent.appendChild(this.container);
            this.orientation = this.config.orientation;
            this.vertical = this.orientation === 'vertical';
            const containerClass = this.container.classList;
            [`${CSSNamespace}container`,this.orientation].forEach((className) => { containerClass.add(className); }); 

            this.direction = this.config.direction;
            const directionToCSS = {
                'left':'rtl',
                'down':'ltr',
                'right':'ltr',
                'up':'rtl'
            }
            
            const parentHeight = parseInt(window.getComputedStyle(this.parent, null).getPropertyValue('height')); 
            
            const _progressElem = __wbn$().create('progress', true)
                                          .setClass(`${CSSNamespace}slider`)
                                          .setAttr('value', this.config.defaultValue.toString())
                                          .setAttr('tabindex', '0')
                                          .setStyle({
                                                direction:directionToCSS[this.direction],
                                                width:this.vertical ? parentHeight : 'inherit'
                                          })
                                          .elem;
                                          
                                          
            if (this.vertical) _progressElem.style.marginLeft = this.config.bar.thickness/2;
            this.container.appendChild(_progressElem);
    
            
            const _ribbonElem = __wbn$().create('div',true).setClass(`${CSSNamespace}ribbon`).elem;
            this.container.appendChild(_ribbonElem);
            
            var handle = this.config.handle;
            
            const _handleElem = __wbn$().create('div', true)
                                        .setClass(`${CSSNamespace}handle ${handle.className || ''}`)
                                        .elem;
            
            const _handleLabelElem = __wbn$().create('div', true)
                                             .setClass(`${CSSNamespace}handle_label`)
                                             .elem;
                _handleElem.appendChild(_handleLabelElem);
           
            this.container.appendChild(_handleElem);
                  
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

    update() {
        this._assignAttributes()
            .then(() => this._createSteps())
            .then(() => this._refreshUI());
        return this;
    }

    _assignAttributes() {
        return new Promise((res) => {
            const {height,min,max} = this.UI();
            const {config} = this;
            
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
            
            this._positionHandle();
            
            (config.handle.show !== true) ? __wbn$(this.handle).hide() : __wbn$(this.handle).show();
            (config.ribbon.show !== true) ? this.progressElem.classList.add('hidden_ribbon') : this.progressElem.classList.remove('hidden_ribbon');
            
            return res(this);
        });
    }
    
    _positionHandle() {
        const { slider, vertical, handle, handleLabel, config: { handle: handleConfig, bar: {thickness: elemHeight }}} = this;
        
        const handleDimension = (dimension) => {
            var thisDimension = this._valOrFunc(handleConfig[dimension],[slider,slider.value],null);
            return (thisDimension === null ? elemHeight * 2 : thisDimension);
        }
        
        const handlePos = this.progressElem[vertical ? 'offsetLeft' : 'offsetTop'] - 
                            (handle.rect()[vertical ? 'width' : 'height'] / 2) + 
                            (vertical ? 0 : elemHeight / 2) + 
                            this._valOrFunc(handleConfig.position,[slider,slider.value],0);

        var handleCoreStyle = {
            'height': handleDimension('height'),
            'width': handleDimension('width'),
            'borderRadius': `${handleDimension('borderRadius')}px`,
        }
        
        const handleAdditionalStyle = this._valOrFunc(handleConfig.style,[slider,slider.value],{});
        
        Object.assign(handleCoreStyle,handleAdditionalStyle);
        Object.assign(handleCoreStyle,vertical ? { 'left':handlePos } : {'top':handlePos});
        
        __wbn$(handle)
            .setStyle(handleCoreStyle);
            
        if (handleConfig.label) {
            const {label} = handleConfig;
            const handleRect = handle.rect();
            const labelRect = handleLabel.rect();
            const labelPosition = this._valOrFunc(label.position,[slider,slider.value],0);
            
            __wbn$(handleLabel)
                .setStyle({
                  'left':handleRect.width/2 - labelRect.width/2 + (vertical ? labelPosition : 0),
                  'top':handleRect.height/2 - labelRect.height/2 + (vertical ? 0 : labelPosition)
                }); 

            
        }
    }
    
    _round = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1);

    _clamp = (val, min, max) => { return val > max ? max : val < min ? min : val; };

    _createSteps() {
        return new Promise((res) => {
            
            const {slider, config: { ticks: { labels }, range: { min, max, step, decimals }}} = this;
    
            const tickLabels = slider.config.ticks.labels;
            var tickData = tickLabels.data;
    
            if (tickData.length == 0 || tickLabels.snap === false) {
    
                var increment = 1;
                var stepVal = (typeof step === 'function') ? step(increment) : step;
    
                var steps: number[] = [];
                steps[0] = min;
    
                for (let i: number = min; i <= max; i += (typeof step === 'function') ? 1 : stepVal) {
                    var newStep = (typeof step === 'function') ? step(increment) : i;
                    steps.push(this._round(newStep, decimals));
                    increment += 1;
                }
                steps.push(max);
    
            } else {
                steps = tickData.map((tick, i) => { return tick.value; });
            }
            
            this.steps = steps;
            return res(this);
        });
    }

    _assignEvents() {
        return new Promise((res) => {         
            
            const {slider,config,tickLabels,container,handle,progressElem,direction} = this;
            const me = this;
            __wbn$(this.container).on(['mousedown','touchstart'], (e) => {
                const {tickVal} = me;
                if (tickVal) {
                    slider.update(tickVal);
                    return;
                }
                document.body.classList.add(`${CSSNamespace}select_disabled`);
                me.config.onDragStart(this,slider.value);
                me.progressDrag = true;
                me._updateProgress(e);
                me.config.onDrag(slider);
            }).on(['mousemove', 'touchmove'], (e) => {
                const {tickVal} = me;
                if (tickVal) return;
                me._updateProgress(e);
                me.config.onDrag(slider);
            },{passive:false});
            
            __wbn$(document).on(['mouseup','touchend'], (e) => { 
                if(me.progressDrag) config.onDragEnd(slider,slider.value); 
                me.progressDrag = false;
                document.body.classList.remove(`${CSSNamespace}select_disabled`); 
            });
            
            document.addEventListener('mousemove', (e) => { 
                me._updateProgress(e)
                    .then(() => { config.onDrag(slider) }); 
            });
            
            if (this.config.arrowKeys) {
                const arrowKeyCodes = {
                    'right': { 37: -1, 39: 1},
                    'left': { 37: 1, 39: -1},
                    'up': {38: 1, 40: -1},
                    'down':{38: -1, 40: 1}
                }
                
                const focusElements = tickLabels.concat([container,handle,progressElem]);
                focusElements.forEach((elem) => {
                    elem.addEventListener('focus',(e) => {
                        me.focused = true; 
                    });
                    elem.addEventListener('blur',(e) => {
                        me.focused = false; 
                    });
                });
                
                 document.addEventListener('keydown', (e) => {
                    var increment = arrowKeyCodes[direction][e.which];
                    if (increment && me.focused) {
                        if (e.shiftKey) increment *= 5;
                        const newValue = Number(slider.value) + (increment * Number(config.range.step));
                        slider.update(newValue);
                    }    
                });
            }
            
            const {min,max} = this.UI();
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
    
            window.addEventListener('resize', (e) => { me._refreshUI(); });
            res(this);
        });
    }
    
    _valOrFunc(item, val, defaultVal) {
        return item ? (typeof item === 'function' ? item.apply(null, val) : item) : defaultVal;
    }
    
    _createTickMarks() {
        return new Promise((res) => {
            
            const { tickMarks, config, container, slider, config: { ticks: { marks: tickMarkConfig }}} = this;
            const { min, max, decimals } = this.UI();
            this.markSteps = [];
            this.tickMarks = [];
            tickMarkConfig.forEach((markSet) => {
                const markRange = markSet.range;
                var step = markRange?.step;
    
                var increment = 1;
                var stepVal = (typeof step === 'function') ? step(increment) : step;
                
                var [markMin,markMax] = [markRange.min,markRange.max];
                
                if (markMin < min || markMax > max) {
                    console.error(`Tick mark range ${markMin}-${markMax} out of default range ${min}-${max}. Ignored.`);
                    markMin = markMin < min-1 ? min : markMin;
                    markMax = markMax > max+1 ? max : markMax;
                }

                let markSteps: number[] = [];
                markSteps.push(markMin);
    
                for (let i: number = markMin; i <= markMax; i += (typeof step === 'function') ? 1 : stepVal) {
                    var newStep = (typeof step === 'function') ? step(increment) : i;
                    markSteps.push(this._round(newStep, decimals));
                    increment += 1;
                }

                markSteps.forEach((markValue,i) => {
                    
                    if (markValue < min || markValue > max) return;
                    var markEle = __wbn$().create('div',true)
                        .setClass(`${CSSNamespace}tick_mark`)
                        .setAttr('wbn-value', markValue)
                        .setStyle({
                            height: markSet.height,
                            width: `${markSet.width}px`,
                            borderRadius: `${markSet.borderRadius}px`,
                            backgroundColor: markSet.color
                         })
                        .elem;   
                    
                    const markStyle = this._valOrFunc(markSet?.style,[slider, markValue],{});
                    const markHoverStyle = this._valOrFunc(markSet?.hoverStyle,[slider, markValue],markStyle);
                    const markSelectedStyle = this._valOrFunc(markSet?.selectedStyle,[slider, markValue],markStyle);
                    
                    Object.assign(markEle.style,markStyle); 

                    const thisMarkEle = __wbn$(markEle);
                    
                   thisMarkEle.on('mouseover',() => {
                        thisMarkEle.setStyle(markHoverStyle);  
                    }).on('mouseout',() => {
                        thisMarkEle.setStyle(slider.value == markValue ? markSelectedStyle : markStyle);  
                    }).on('selected',() => {
                        thisMarkEle.setStyle(markSelectedStyle);
                        this._updateHandle(markValue)
                    }).on('deselected',() => {
                         thisMarkEle.setStyle(markStyle);
                    });
                    
                    Object.assign(markEle,{ position: markSet.position });
                    container.appendChild(markEle);
                    this.tickMarks.push(markEle);
                });
                
                this.markSteps = this.markSteps.concat(markSteps);
            });
            //this._refreshUI();
            res(this);
        });
    }
    
    _positionTickMark(markEle: any, markValue: number) {
            const { vertical, slider } = this;
            const { positionProperty, progressThickness } = this.UI();
  
            //re-register default style if tickMark is in selected state
            const [deselectedEvent, selectedEvent] = ['deselected', 'selected'].map((customEvent) => { return new CustomEvent(customEvent); });
            if (markValue == slider.value)
                markEle.dispatchEvent(deselectedEvent);
            const markPosition = this._valOrFunc(markEle.position,[slider, markValue],0);
            const markPoints = this._tickPoint(markEle, markValue, markPosition);
             
            markEle.style[vertical ? 'left' : 'top'] = markPoints[1];
            markEle.style[positionProperty] = markPoints[0] + (vertical ? progressThickness/2 : 0);
            
            //re-register selected state, if present
            if (markValue == slider.value) markEle.dispatchEvent(selectedEvent);
            return this;
    }
    
    _createTickLabels() {
        
        return new Promise((res) => {
            const {slider,container,slider: { config: { ticks: { labels: tickLabels }}}} = this;
            
            const {min,max} = this.UI();
            var {data: tickData} = tickLabels;
            if (tickData.length === 0) return this;
            
            const uniq = (val, i, self) => { return self.indexOf(val) === i };
            tickData.sort((a,b) => (a.value > b.value) ? 1 : -1).filter(uniq);
            tickData = tickData.filter((tick) => { 
                const inRange = (tick.value > min && tick.value < max);
                if (!inRange) console.error(`Tick label value ${tick.value} out of range. Ignored.`);
                return inRange; 
            });
            slider.config.ticks.labels.data = tickData;
            this.tickLabels = [];
            
            const me = this;
            var ticksAndSteps: any[] = tickData.map((tick, i) => { return tick.value; }).sort();
            
            ticksAndSteps.forEach((tick, i) => {
                
                const tickValue = tickData[i].value !== undefined ? tickData[i].value : tick;
                const tickLabel = this._valOrFunc(tickData[i]?.label?.text,[this.slider,tickData[i]?.value,i],tickData[i]?.value); 
                const tickClassName = tickLabels.className || tick.className || ''; 
                const tickStyles = {
                    style: {},
                    hoverStyle: {},
                    selectedStyle: {}
                };
                
                ['style','hoverStyle','selectedStyle'].forEach((styleVar) => {
                    tickStyles[styleVar] = {
                        ...this._valOrFunc(tickData[i]?.label[styleVar],[this.slider,tickData[i]?.value,i],{}),
                        ...this._valOrFunc(tickLabels[styleVar],[this.slider,tickData[i]?.value,i],{})
                    }
                });

                            
                var tickEle = __wbn$().create('div', true)
                    .setStyle(tickStyles.style)
                    .setClass(`${CSSNamespace}tick_label ${tickClassName}`)
                    .setAttr('wbn-value', tickValue)
                    .html(tickLabel);
                 
                tickEle.on(['mouseover','focus'],(e) => {
                    tickEle.setStyle(tickStyles.hoverStyle);
                }).on(['mouseout','blur','deselected'],(e) => {
                    if (!tickEle.elem.classList.contains('wbn_selected')) 
                        tickEle.setStyle(tickStyles.style);
                    else 
                        tickEle.setStyle(tickStyles.selectedStyle);
                }).on('selected',(e) => {
                    tickEle.setStyle(tickStyles.selectedStyle);
                })
    
                me.container.appendChild(tickEle.elem);
                me._positionTickLabel(tickEle.elem, tickValue, tickData[i],i);
                me.tickLabels.push(tickEle.elem);
                
                
            });
            res(this);
        });
    }
    
    _tickPoint(ele: Element,val: number,position: number) {
        const { vertical, progressElem, config: { range: { min, max } } } = this;
        const { progressLength, progressOffset, directionAlias, progressThickness, positionOffsetProperty } = this.UI();
        const tickPointsX = {
            'right': (val - min) * progressLength / (max - min) + progressOffset,
            'left': (max - val) * progressLength / (max - min) + progressOffset
        };
        const tickThickness = ele.rect()[this.vertical ? 'height' : 'width'];
        const tickLength    = ele.rect()[this.vertical ? 'width' : 'height'];
        const tickPointX = tickPointsX[directionAlias] - tickThickness/2;
        
        var tickPointY = progressElem[positionOffsetProperty] + (vertical ? 0 : (progressThickness / 2)) - tickLength / 2;
        tickPointY += position;

        return [tickPointX, tickPointY];
    }
    
    _centerPoint(ele: Element,val: number,position: number) {
         const {progressLength,progressOffset,directionAlias,progressThickness} = this.UI();
         const eleWidth = ele.rect()[this.vertical ? 'height' : 'width'];
         const eleHeight = ele.rect()[this.vertical ? 'width' : 'height']
         const xPoints = {
             'right':progressOffset - eleWidth/2 + this._clamp(val / 100, 0, 1) * progressLength,
             'left':(progressOffset + progressLength) - eleWidth/2 - this._clamp(val / 100, 0, 1) * progressLength,
         }
         const yPoint = {
             'top': xPoints[directionAlias] + progressThickness/2 - eleHeight/2 + position
         }
         return [xPoints[directionAlias],yPoint['top']];
    }
    

    _positionTickLabel(tickEle: any, tickValue: number, tickData: TickLabel, tickIndex: number) {
        const {vertical,slider,progressElem,config: { ticks: { labels: tickLabels }}} = this;
        const {min,max,positionProperty} = this.UI();
        if (tickValue < min || tickValue > max) return;
        const me = this;
        let tickPosition = this._valOrFunc(tickLabels.position,[slider,tickValue,tickIndex],0);
        const tickPoints = this._tickPoint(tickEle,tickValue,tickPosition);
        tickEle.style[positionProperty] = tickPoints[0];
        tickEle.style[vertical ? 'left' : 'top'] = tickPoints[1];
        
        if (tickLabels.labelsClickable !== false) {
            __wbn$(tickEle).setAttr('tabindex','0');
            const [deselectedEvent,selectedEvent] = ['deselected','selected'].map((customEvent) => { return new CustomEvent(customEvent) });
            
            var _tickClick = (e: KeyboardEvent) => {
                if (e.which && e.which != 13) return;
                this.tickLabels.forEach((elem) => elem.dispatchEvent(deselectedEvent));
                
                me._updateTicks(tickValue)
                  .then(() => this._updateValue(this._wbnValToProgVal(tickValue),tickValue))
                  .then(() => this._updateBindings());
                
                tickEle.classList.add('wbn_selected');
                tickEle.dispatchEvent(selectedEvent);
                tickLabels.onTick(tickValue,tickData,tickEle,tickIndex,slider);
                e.stopPropagation();
                e.preventDefault();
            }
            
            const tickEventListeners = ['click','mousedown','keydown'];
            
            if (tickEle._eventHandler) {
                tickEventListeners.forEach((listener) => {
                     tickEle.removeEventListener(listener, tickEle._eventHandler);
                });
            }
            tickEle.classList.add('clickable');
            tickEventListeners.forEach((listener) => {
                tickEle.addEventListener(listener, _tickClick);
            });
            tickEle._eventHandler = _tickClick;
        }
       
    }
    
    async _updateTicks(val: number) {
        const ticksUpdated = new Promise((res) => {
            const [deselectedEvent,selectedEvent] = ['deselected','selected'].map((customEvent) => { return new CustomEvent(customEvent) });
            this.tickLabels.concat(this.tickMarks).forEach((tick) => { (Number(tick.getAttribute('wbn-value')) === val) ? [tick.classList.add('wbn_selected'),tick.dispatchEvent(selectedEvent)] : [tick.classList.remove('wbn_selected'),tick.dispatchEvent(deselectedEvent)] });
            res(this);
        });
        
        return await ticksUpdated;
    }
    
    _createCaps() {
        return new Promise((res) => {
            
            const { caps: {startCap,endCap} } = this.config;
            if (!startCap && !endCap) res(this);
            
            const { slider, vertical, direction, progressElem } = this;
            const { positionProperty, progressRect, progressThickness, positionOffsetProperty } = this.UI();
            
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
                
                const _capStyle = this._valOrFunc(capConfig.style,[slider,slider.value],{}); 
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
    
    _createTooltip() {
        
        const { container, progressDrag, vertical, tickLabels, config: { tooltips: tooltipConfig, ticks: { labels: { data: labelData }}}} = this;
       
        if (tooltipConfig.show === false) return this;
        
        const containerRect = container.rect();
        const _tooltip = __wbn$().create('div',true)
                                 .setClass(`${CSSNamespace}tooltip`)
                                 .setStyle({display:'none'})
                                 .elem;

        container.appendChild(_tooltip);
        
        this.tickOn = null;
        const posProperty = vertical ? 'clientY' : 'clientX';
        
        tickLabels.forEach((tickEle,i) => {
            __wbn$(tickEle).on('mouseover',(e) => { 
                this.tickOn = i;
                this.tickVal = labelData ? labelData[i].value : null;
                //if (tooltipConfig.ticks.show) this._showTooltip(_tooltip,e[posProperty] || e.touches[0][posProperty], this.tickOn, this.tickVal);
            }).on('mouseout',() => { 
                this.tickVal = null;
                this.tickOn = null; 
            });
        });
        
        [container,document].forEach((elem) => {
            __wbn$(elem).on(['mouseover','mousemove','touchmove','touchstart'],(e: any) => {
                if (this.tickOn && !tooltipConfig.ticks.show) return;
                if (progressDrag || e.currentTarget == container) this._showTooltip(_tooltip,e[posProperty] || e.touches[0][posProperty], this.tickOn, this.tickVal);
            }).on(['touchend','mouseup','mouseout'],() => {
                _tooltip.hide();
            });
        });

        this.tooltip = _tooltip;
        return this;
    }

    _showTooltip(_tooltip: HTMLElement,tooltipStart: number,tickIndex?: number | null,tickVal?: string | null) {
        
        const { progressElem, slider, steps, vertical, config: {tooltips: tooltipConfig } } = this;
        const { positionOffsetProperty, progressTop, progressBottom, progressThickness, directionAlias, progressLeft, progressRight, progressLength } = this.UI();
        const _offsetStart: number = tooltipStart;
        
        var _parentOffsetStart: number,_parentOffsetEnd: number;
        _parentOffsetStart  = vertical ? progressTop || 0 : progressLeft || 0;
        _parentOffsetEnd    = vertical ? progressBottom || 0 :  progressRight || 0;
        
        const _progValue = {
            'right':((_offsetStart - _parentOffsetStart) / progressLength) * 100,
            'left':((_parentOffsetEnd - _offsetStart) / progressLength) * 100,
        }
        
        var wbnVal: number;
        if (tickVal || tickVal == '0') {
            wbnVal = Number(tickVal);
        } else {
            wbnVal = this._progValToWbnVal(_progValue[directionAlias].toFixed(2).toString()); 
            if (steps.length > 0) wbnVal = this._wbnValToStep(wbnVal);
        }
             
        var labelConfig = tickIndex !== null ? tooltipConfig.ticks.label : tooltipConfig.label;
        var _tooltipText = this._valOrFunc(labelConfig.text,[slider,wbnVal,tickIndex],wbnVal);
        
        const _tooltipStyle = {
            ...this._valOrFunc(labelConfig.style,[slider,wbnVal,tickIndex],{}),
            ...this._valOrFunc(tooltipConfig.style,[slider,wbnVal,tickIndex],{})
        };
        
        __wbn$(_tooltip).setStyle(_tooltipStyle);        
        _tooltip.innerHTML = _tooltipText;
        _tooltip.show();
        
        const tooltipPosition = this._valOrFunc(tooltipConfig.position,[slider,wbnVal],0);
        const [tooltipPointX, tooltipPointY] = this._tickPoint(_tooltip,wbnVal,tooltipPosition);
        const tooltipTop = progressElem[positionOffsetProperty] + (vertical ? 0 : progressThickness/2) - (_tooltip.rect()[vertical ? 'width' : 'height']/2) + tooltipPosition;

        const _finalStyle = vertical ? {
            top: tooltipPointX,
            left: tooltipTop
        } : {
            left: tooltipPointX,
            top: tooltipTop
        }

        Object.assign(_tooltip.style,_finalStyle);
    }
    
    _updateHandle(val: number) {
        return new Promise((res) => {
            const { progressThickness } = this.UI();
            const {handle,vertical,config,slider} = this;
            this._positionHandle();
            const [handlePtX,handlePtY] = this._centerPoint(handle,val,this._valOrFunc(config.handle.position,[slider,slider.value],0));
            __wbn$(handle).setStyle(vertical ? { 'top' : handlePtX + (progressThickness/2) } : { 'left' : handlePtX });
            
            const { handleLabel,  config: { handle: { label: labelConfig }}} = this;
            if ( labelConfig ) {
                const labelValue = slider.value || slider.defaultValue || null;
                var labelHtml = this._valOrFunc(labelConfig.text,[slider,labelValue],labelValue);
                __wbn$(handleLabel).html(labelHtml);
                             
                 var handleLabelStyle = this._valOrFunc(labelConfig.style,[slider,slider.value],{});
                 Object.assign(handleLabel.style,handleLabelStyle);  
            }
            res(this);
        });
    }

    _refreshUI() {
        const {progressBottom,progressRight,positionProperty} = this.UI();
        const {vertical,progressElem,slider: { config: { ticks }}} = this;
        const tickLabelData = ticks.labels.data;

        const progressValue = Number(progressElem.value);
        
        this._constrainContainer();

        this.tickLabels.forEach((tick, i) => {
            const labelValue = tickLabelData[i] ? tickLabelData[i].value : tick
            this._positionTickLabel(tick, labelValue, tickLabelData[i], i);
        });

        this.tickMarks.forEach((markEle,i) => {
            this._positionTickMark(markEle,this.markSteps[i]);
        });
        
        var endCap = this.direction == 'down' || this.direction == 'left' ? this.startCap : this.endCap;
        if (endCap) {
            endCap.style[positionProperty] = vertical ? progressBottom : progressRight;
        }
        
        this._responsiveUI()._updateHandle(progressValue);
        
        return this;
       
    }
    
    _constrainContainer() {
        const { containerRect, parentHeight, parentWidth, progressThickness } = this.UI();
        const { tickLabels, startCap, endCap, vertical, tickMarks, direction, progressElem } = this;
        
        const container = __wbn$(this.container).elem;
        
        var boundaries = {
            'start': vertical ? 'top' : 'left',
            'end': vertical ? 'bottom' : 'right'
        };
        
        const getBounds = (ele) => [boundaries.start,boundaries.end].map((key) => { return ele ? ele[key] : null });
        
        let [boundaryStart,boundaryEnd] = getBounds(containerRect);
        tickLabels.concat(tickMarks).forEach((tick, i) => {
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
    
    _responsiveUI() {
        
        const { config, config: { responsive }, orientation, direction, tickLabels, tickMarks } = this;
        
        if (responsive === false) return this;

        var lastRect;
        let outOfBounds = (tickRect) => {
            if (orientation == 'horizontal')
                return (direction == 'right' ? tickRect.left <= lastRect.right : tickRect.right >= lastRect.left)
            else
                return (direction == 'down' ? tickRect.bottom <= lastRect.top : tickRect.top >= lastRect.bottom)  
         };
        
        const tickGroups = [tickLabels,tickMarks];
        
        tickGroups.forEach((tickGroup) => {
            lastRect = null;
            tickGroup.forEach((tick, i) => {
                var tickRect = tick.rect();
                __wbn$(tick).setStyle({ visibility: (lastRect && outOfBounds(tickRect)) ? 'hidden' : 'visible' });
                if (__wbn$(tick).getStyle('visibility') != 'hidden') lastRect = tickRect;
            });
        });
        return this;
    }

    _wbnValToProgVal(wbnVal: number) {
        return this.slider._wbnValToProgVal(wbnVal);
    }

    _updateValue(val: number, wbnVal: number) {
        return new Promise((res) => {
            this.slider._updateValue(val, wbnVal)
            res(this);
        });
    }

    _updateBindings() {
        return this.slider._updateBindings();
    }
    
    _progValToWbnVal(progVal: number): number {
        const {min,max,decimals} = this.UI();
        return this._round(this._clamp(min + ((max - min) * progVal / 100), min, max), decimals);
    }
    
    _wbnValToStep(wbnVal: number): number {
        const steps = this.steps;
        var nearestSteps = [];
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
    
    _updateProgress(e: any, tickPos?: number) {
        return new Promise((res) => {
            const { progressTop, progressLeft,progressBottom,progressRight,progressLength,directionAlias } = this.UI();
            const { progressElem, steps } = this;
    
            if (!this.progressDrag && !tickPos && e.touches === undefined) return
            const posProperty = this.vertical ? 'clientY' : 'clientX';
            const clientPos = e ? e[posProperty] || e.touches[0][posProperty] : tickPos;
            
            const progressVal = {
                'right':(clientPos - (this.vertical ? progressTop : progressLeft)) / progressLength * 100,
                'left':((this.vertical ? progressBottom : progressRight) - clientPos) / progressLength * 100
            }
            
            var wbnVal = this._progValToWbnVal(progressVal[directionAlias]);
            var newVal;

            if (steps.length) {
                wbnVal = this._wbnValToStep(wbnVal);
                newVal = this._wbnValToProgVal(wbnVal);
            } else {
                newVal = progressVal;
            }
    
            this._updateValue(newVal, wbnVal)
                .then(() => { this._updateHandle(newVal) })
                .then(() => { this._updateBindings() })
            res(this);
        });
       
    }

}
    
