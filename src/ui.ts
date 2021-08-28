import { Options, CSSNamespace, Direction, Orientation,TickLabel } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
declare global {
    interface Element {
        rect(): DOMRect;
    }
}
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

    constructor(parent: any, config: Options, slider: any) {
        
        Element.prototype.rect = function() {
            return this.getBoundingClientRect();
        };
        
        Object.assign(this,{
            slider: slider,
            config: config,
            parent: parent,
            focused: false,
            uiReady: false,
            tickLabels: [],
            steps: []
        });

        this.uiCreated = Promise.all(
            [
                this._createElements(),
                this._createSteps(),
                this._createTickLabels(),
                this._createTickMarks(),
                this._createTooltip(),
                this._assignEvents(),
                this._refreshUI(),
                this._responsiveUI(),
                this.UI()
            ]
        ).then(() => {
            this.uiReady = true;
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
            this.container.classList.add(`${CSSNamespace}container`);
            this.container.classList.add(this.orientation);

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
        const {config,slider,vertical,handle,handleLabel} = this;
        const elemHeight    = config.bar.thickness;
        const handleConfig  = config.handle;
        
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
            const labelConfig = handleConfig.label;
            const handleRect = handle.rect();
            const labelRect = handleLabel.rect();
            const labelPosition = this._valOrFunc(labelConfig.position,[slider,slider.value],0);
            
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
            
            const {min,max,decimals} = this.UI();
    
            const tickLabels = this.slider.config.ticks.labels;
            var tickData = tickLabels.data;
    
            if (tickData.length == 0 || tickLabels.snap === false) {
    
                var step = this.slider.config.range.step;
    
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
            
            const {slider,config,tickLabels,container,handle,progressElem,direction,tickVal} = this;
            const me = this;
            __wbn$(this.container).on(['mousedown','touchstart'], (e) => {
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
                if (tickVal) return;
                me._updateProgress(e);
                me.config.onDrag(slider);
            },{passive:false});
            
            __wbn$(document).on(['mouseup','touchend'], (e) => { 
                if(me.progressDrag) config.onDragEnd(slider); 
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
            
            const {config,container,slider} = this;
            const tickMarkConfig = config.ticks.marks;
            const {min,max,decimals} = this.UI();
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
                    
                    const markStyle = this._valOrFunc(markSet?.style,[slider, markValue ,i],{});
                    const markHoverStyle = this._valOrFunc(markSet?.hoverStyle,[slider, markValue ,i],markStyle);
                    const markSelectedStyle = this._valOrFunc(markSet?.selectedStyle,[slider, markValue ,i],markStyle);
                    
                    Object.assign(markEle.style,markStyle); 
                    
                    this.container.appendChild(markEle);
                    
                    const thisMarkEle = __wbn$(markEle);
                    
                   thisMarkEle.on('mouseover',() => {
                        thisMarkEle.setStyle(markHoverStyle);  
                    }).on('mouseout',() => {
                        thisMarkEle.setStyle(slider.value == markValue ? markSelectedStyle : markStyle);  
                    }).on('selected',() => {
                        thisMarkEle.setStyle(markSelectedStyle);
                    }).on('deselected',() => {
                         thisMarkEle.setStyle(markStyle);
                    });
                    
                    let markPosition = this._valOrFunc(markSet.position,[slider, markValue, i],0);
                    markEle.position = markPosition;
                    
                    this.tickMarks.push(markEle);
                    this._positionTickMark(markEle,markValue);
                });
                
                this.markSteps = this.markSteps.concat(markSteps);
            });
            this._refreshUI();
            res(this);
        });
    }
    
    _positionTickMark(markEle: any, markValue: number) {
       
            const {min,max,progressLength,progressOffset,progressLeft,progressTop,progressThickness,directionAlias,positionProperty} = this.UI();
            const markRect = markEle.rect();

            //re-register default style if tickMark is in selected state
            const deselectedEvent = new CustomEvent('deselected');
            const selectedEvent = new CustomEvent('selected');
            if (markValue == this.slider.value) markEle.dispatchEvent(deselectedEvent);
            
            const markThickness = markRect[this.vertical ? 'height' : 'width'];
            const tickPos = {
                'right':(markValue - min) * progressLength / (max - min) + progressOffset,
                'left':(max - markValue) * progressLength / (max - min) + progressOffset
            }
            
            const markTop = (this.vertical ? progressLeft : progressTop) + (progressThickness/2) - (markRect[this.vertical ? 'width' : 'height']/2) + markEle.position;
            markEle.style[this.vertical ? 'left' : 'top'] = markTop;
            
            var tickMarkPos = tickPos[directionAlias];
            tickMarkPos = tickMarkPos - markThickness/2 + (this.vertical ? progressThickness/2 : 0);
             
            markEle.style[positionProperty] = tickMarkPos;
            
            //re-register selected state, if present
            if (markValue == this.slider.value) { 
                markEle.dispatchEvent(selectedEvent);
                this._updateHandle(this._wbnValToProgVal(markValue));
            }
            
            return this;
    }
    
    _createTickLabels() {
        
        return new Promise((res) => {
            const {slider,container} = this;
            const {labels: tickLabels} = slider.config.ticks;
            
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

    _positionTickLabel(tickEle: any, tickValue: number, tickData: TickLabel, tickIndex: number) {
        const {min,max,progressLength,progressOffset,progressThickness,directionAlias,positionProperty,positionOffsetProperty} = this.UI();
        if (tickValue < min || tickValue > max) return;
        const me = this;
        const tickLabels = this.config.ticks.labels;
        
        const tickPos = {
            'right':(tickValue - min) * progressLength / (max - min) + progressOffset,
            'left':(max - tickValue) * progressLength / (max - min) + progressOffset
        }
        
        var tickFinalPos = tickPos[directionAlias] - (tickEle.rect()[this.vertical ? 'height' : 'width'] / 2) + (this.vertical ? progressThickness/2 : 0);
        tickEle.style[positionProperty] = tickFinalPos;
        
        const handleRect = this.handle.rect();
        
        const handleTop = this.config.handle.show ? __wbn$(this.handle).elem.offsetTop : this.progressElem.offsetTop;
        const handleBottom = this.config.handle.show ? handleTop + handleRect.height : this.progressElem.offsetTop + progressThickness;
        
        const tickHeight = tickEle.rect()[this.vertical ? 'width' : 'height'];
        
        let tickPosition = this._valOrFunc(tickLabels.position,[this.slider,tickValue,tickIndex],0);
        var finalTickPos = tickPosition === null ? this.progressElem[positionOffsetProperty] + progressThickness + 4 : tickPosition;        
        
        if (this.vertical) {
            if (tickPosition == 0) {
                finalTickPos = finalTickPos - (progressThickness)/2 - tickHeight/2;
            }
            if (tickPosition < 0) {
                finalTickPos -= progressThickness + tickHeight;
            }
           
        } else {
             finalTickPos -= tickHeight/2;
        }
        
        finalTickPos = this.progressElem[positionOffsetProperty] + (progressThickness/2) + finalTickPos;
        tickEle.style[this.vertical ? 'left' : 'top'] = finalTickPos;
        
        if (tickLabels.labelsClickable !== false) {
            __wbn$(tickEle).setAttr('tabindex','0');
            const selectedEvent = new CustomEvent('selected');
            const deselectedEvent = new CustomEvent('deselected');
            var _tickClick = (e) => {
                if (e.which && e.which != 13) return;
                this.tickLabels.forEach((elem) => elem.dispatchEvent(deselectedEvent));
                
                me._updateTicks(tickValue)
                  .then(() => this._updateValue(this._wbnValToProgVal(tickValue),tickValue))
                  .then(() => this._updateBindings());
                
                tickEle.classList.add('wbn_selected');
                tickEle.dispatchEvent(selectedEvent);
                tickLabels.onTick(tickValue,tickData,tickEle,tickIndex,this.slider);
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
        
        return tickFinalPos;
    }
    
    async _updateTicks(val: number) {
        const ticksUpdated = new Promise((res) => {
            const selectedEvent = new CustomEvent('selected');
            const deselectedEvent = new CustomEvent('deselected');
            this.tickLabels.concat(this.tickMarks).forEach((tick) => { (Number(tick.getAttribute('wbn-value')) === val) ? [tick.classList.add('wbn_selected'),tick.dispatchEvent(selectedEvent)] : [tick.classList.remove('wbn_selected'),tick.dispatchEvent(deselectedEvent)] });
            res(this);
        });
        
        return await ticksUpdated;
    }
    
    _createCaps() {
        const capConfig = this.slider.config.caps;
        const startCapConfig = capConfig.startCap;
        const endCapConfig = capConfig.endCap;
        if (!startCapConfig && !endCapConfig) return this;
        
        const ui = this.UI();
        const capProps =  {
                'up' : ['top','bottom'],
                'down' : ['bottom','top'],
                'right' : ['left','right'],
                'left': ['right','left'] 
        };
            
        [startCapConfig,endCapConfig].forEach((capConfig,i) => {

            const capObj = i == 0 ? 
            {
                prop: capProps[this.direction][0],
                desc: 'start'
            } : {
                prop: capProps[this.direction][1],
                desc: 'end'
            };
            
            if (!capConfig) {
                i == 0 ? [this.startCap = null] : [this.endCap == null];
                return this;
            }
           
            var _capStyle = this._valOrFunc(startCapConfig.style,[this.slider],{});
            
            const _capElement = __wbn$().create('div',true)
                                .setClass(`${CSSNamespace}cap ${capObj.desc}`)
                                .setStyle(_capStyle)
                                .html(capConfig.label.text)
                                .elem;
                                            
            this.parent.appendChild(_capElement);
            _capElement.style[this.vertical ? 'top' : 'left'] = ui.containerRect[capObj.prop] - (capObj.prop == 'right' ? _capElement.rect()[this.vertical ? 'height' : 'width'] : 0);

            i == 0 ? [this.startCap = _capElement] : [this.endCap = _capElement];
            
            
        });
      
        return this;
    }
    
    _createTooltip() {
        
        const tooltipConfig = this.slider.config.tooltips;
        
        if (tooltipConfig.show === false) return this;
        
        const containerRect = this.container.rect();
        const _tooltip = __wbn$().create('div',true)
                                 .setClass(`${CSSNamespace}tooltip`)
                                 .setStyle({display:'none'})
                                 .elem;

        this.container.appendChild(_tooltip);
        
        this.tickOn = null;
        const posProperty = this.vertical ? 'clientY' : 'clientX';
        
        this.tickLabels.forEach((tickEle,i) => {
            __wbn$(tickEle).on('mouseover',(e) => { 
                this.tickOn = i;
                this.tickVal = this.config.ticks.labels.data ? this.config.ticks.labels.data[i].value : null;
                //if (tooltipConfig.ticks.show) this._showTooltip(_tooltip,e[posProperty] || e.touches[0][posProperty], this.tickOn, this.tickVal);
            }).on('mouseout',() => { 
                this.tickVal = null;
                this.tickOn = null; 
            });
        });
        
        [this.container,document].forEach((elem) => {
            __wbn$(elem).on(['mouseover','mousemove','touchmove','touchstart'],(e: any) => {
                if (this.tickOn && !tooltipConfig.ticks.show) return;
                if (this.progressDrag || e.currentTarget == this.container) this._showTooltip(_tooltip,e[posProperty] || e.touches[0][posProperty], this.tickOn, this.tickVal);
            }).on(['touchend','mouseup','mouseout'],() => {
                _tooltip.style.display = 'none'; 
            });
        });

        this.tooltip = _tooltip;
        return this;
    }

    _showTooltip(_tooltip: HTMLElement,tooltipStart: number,tickIndex?: number | null,tickVal?: string | null) {
        
        const {slider,config,steps,vertical} = this;
        const tooltipConfig = config.tooltips;
       
        const {min,max,progressOffset,progressTop,progressBottom,progressThickness,directionAlias,progressLeft,progressRight,progressLength} = this.UI();
        
        const _offsetStart: number = tooltipStart;
        
        var _parentOffsetStart,_parentOffsetEnd;
        
        if (vertical) {
            _parentOffsetStart = progressTop || 0;
            _parentOffsetEnd = progressBottom || 0;
        } else {
            _parentOffsetStart = progressLeft || 0;
            _parentOffsetEnd = progressRight || 0;
        }
        
        const _progValue = {
            'right':((_offsetStart - _parentOffsetStart) / progressLength) * 100,
            'left':((_parentOffsetEnd - _offsetStart) / progressLength) * 100,
        }
        
        var wbnVal: number;
        
        if (tickVal || tickVal == '0') {
            wbnVal = Number(tickVal);
        } else {
            wbnVal = this._progValToWbnVal(_progValue[directionAlias].toFixed(2).toString()); 
            if (steps.length > 0) {
                wbnVal = this._wbnValToStep(wbnVal);
            }
        
        }
             
        var labelConfig = tickIndex !== null ? tooltipConfig.ticks.label : tooltipConfig.label;
        var _tooltipText = this._valOrFunc(labelConfig.text,[slider,wbnVal,tickIndex],wbnVal);
        
        const _tooltipStyle = {
            ...this._valOrFunc(labelConfig.style,[slider,wbnVal,tickIndex],{}),
            ...this._valOrFunc(tooltipConfig.style,[slider,wbnVal,tickIndex],{})
        };
        
        __wbn$(_tooltip).setStyle(_tooltipStyle);
        
        _tooltip.innerHTML = _tooltipText;
        _tooltip.style.display = 'block';
        
        const _tooltipLeft = {
            'right':(wbnVal - min) * progressLength / (max - min) + progressOffset - (_tooltip.clientWidth / 2),
            'left':(max - wbnVal) * progressLength / (max - min) + progressOffset - (_tooltip.clientWidth / 2)
        };
        
        let tooltipPosition = this._valOrFunc(tooltipConfig.position,[slider,wbnVal],0);
        
        const _tooltipPosition = tooltipPosition === null ? -(_tooltip.clientHeight/2) - 4 : tooltipPosition;   
        const _tooltipTop = this.progressElem.offsetTop + (progressThickness/2) - (_tooltip.clientHeight/2) + _tooltipPosition;
        
        var _finalStyle:{};
        
        if (vertical) {
            _finalStyle = {
                top: _tooltipLeft[directionAlias],
                left: _tooltipTop
            }
        } else {
            _finalStyle = {
                left: _tooltipLeft[directionAlias],
                top: _tooltipTop
            }
        }
        
        Object.assign(_tooltip.style,_finalStyle);
    }

    _updateHandle(val: number) {
        
        return new Promise((res) => {
        
            const {progressLength,progressOffset,directionAlias,progressThickness} = this.UI();
            this._positionHandle();
            const handleWidth = this.handle.rect()[this.vertical ? 'height' : 'width'];
            const handleLeft = {
                'right':progressOffset - handleWidth/2 + this._clamp(val / 100, 0, 1) * progressLength,
                'left':(progressOffset + progressLength) - handleWidth/2 - this._clamp(val / 100, 0, 1) * progressLength 
            };
            const ribbonWidth = {
                'right':handleLeft[directionAlias] - progressOffset + handleWidth / 2,
                'left':(progressOffset+progressLength) - handleLeft[directionAlias] - handleWidth / 2,
            }
            
            const ribbonLeft = {
                'right':progressOffset,
                'left':(progressOffset+progressLength)-ribbonWidth['left']
            }
            
            if (this.vertical) {
                __wbn$(this.ribbon)
                    .setStyle({
                        'height': ribbonWidth[directionAlias],
                        'top': ribbonLeft[directionAlias] 
                    }); 
                __wbn$(this.handle)
                    .setStyle({ 'top': handleLeft[directionAlias] + progressThickness/2 });
            } else {
                __wbn$(this.ribbon)
                    .setStyle({
                        'width': ribbonWidth[directionAlias],
                        'left': ribbonLeft[directionAlias] 
                    }); 
                __wbn$(this.handle)
                    .setStyle({ 'left': handleLeft[directionAlias] });
            }
            
            if (this.config.handle.label ) {
                const labelConfig = this.config.handle.label;
                const labelValue = this.slider.value || this.slider.defaultValue || null;
                var labelHtml = this._valOrFunc(labelConfig.text,[this.slider,labelValue],labelValue);
                __wbn$(this.handleLabel).html(labelHtml);
                             
                 var handleLabelStyle = this._valOrFunc(labelConfig.style,[this.slider,this.slider.value],{});
                 Object.assign(this.handleLabel.style,handleLabelStyle);  
            }
            
            res(this);
        });
    }

    _refreshUI() {

        const ui = this.UI();
        const tickLabelData = this.slider.config.ticks.labels.data;
        const progressElem = this.progressElem;
        const progressValue = Number(progressElem.value);
        
        this._constrainContainer();
        
        var endCap = this.direction == 'down' || this.direction == 'left' ? this.startCap : this.endCap;
        
        if (endCap) {
            Object.assign(endCap.style, this.vertical ? { 
                top: this.parent.clientHeight
            } : {
                left: this.parent.clientWidth
            });
        }
        
        this.tickLabels.forEach((tick, i) => {
            const labelValue = tickLabelData[i] ? tickLabelData[i].value : tick
            this._positionTickLabel(tick, labelValue, tickLabelData[i], i);
        });

        this.tickMarks.forEach((markEle,i) => { 
            this._positionTickMark(markEle,this.markSteps[i]);
        });
        
        this._responsiveUI()._updateHandle(progressValue);
        return this;
       
    }
    
    _constrainContainer() {
        const {containerRect,parentHeight,parentWidth} = this.UI();
        
        const container = __wbn$(this.container).elem;
        
        var boundaries = {
            'start': this.vertical ? 'top' : 'left',
            'end': this.vertical ? 'bottom' : 'right'
        };
        
        var boundaryStart = containerRect[boundaries.start];
        var boundaryEnd = containerRect[boundaries.end];
        
        this.tickLabels.concat(this.tickMarks).forEach((tick, i) => {
            var tickStart = tick.rect()[boundaries.start];
            boundaryStart = tickStart < boundaryStart ? tickStart : boundaryStart;
            var tickEnd = tick.rect()[boundaries.end];
            boundaryEnd = tickEnd > boundaryEnd ? tickEnd : boundaryEnd; 
        });
        
       boundaryStart = containerRect[boundaries.start] - boundaryStart;
       boundaryEnd = boundaryEnd - containerRect[boundaries.end];
       
       const capProp = this.vertical ? 'height' : 'width';
       const capStart = (this.startCap ? this.startCap.rect()[capProp] : 0);
       const capEnd = (this.endCap ? this.endCap.rect()[capProp] : 0);
       const capTotal = capStart+capEnd;

       __wbn$(this.container).setStyle(this.vertical ? {
           height: parentHeight - (boundaryEnd) - (boundaryStart) - 2 - capTotal,
           marginTop: (this.direction == 'down') ? boundaryStart+capStart : boundaryStart+capStart 
        } : {
           width: parentWidth - (boundaryEnd) - (boundaryStart) - 2 - capTotal,
           marginLeft: boundaryStart + capStart
        });
        
        if (this.vertical) {
            __wbn$(this.progressElem).setStyle({
                width: parentHeight - (boundaryEnd) - (boundaryStart) - 2 - capTotal,
            }) 
        }
    }
    
    _responsiveUI() {

        if (this.config.responsive === false) return this;
        const ui = this.UI();
        let lastRect;
        
        let outOfBounds = (tickRect) => {
            if (this.orientation == 'horizontal')
                return (this.direction == 'right' ? tickRect.left <= lastRect.right : tickRect.right >= lastRect.left)
            else
                return (this.direction == 'down' ? tickRect.bottom <= lastRect.top : tickRect.top >= lastRect.bottom)  
         };
        
        const tickGroups = [this.tickLabels,this.tickMarks];
        
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
            const {progressTop,progressLeft,progressBottom,progressRight,progressLength,directionAlias} = this.UI();
            const progressElem = this.progressElem;
    
            if (!this.progressDrag && !tickPos && e.touches === undefined) return
            const posProperty = this.vertical ? 'clientY' : 'clientX';
            const clientPos = e ? e[posProperty] || e.touches[0][posProperty] : tickPos;
            
            const progressVal = {
                'right':(clientPos - (this.vertical ? progressTop : progressLeft)) / progressLength * 100,
                'left':((this.vertical ? progressBottom : progressRight) - clientPos) / progressLength * 100
            }
            
            var wbnVal = this._progValToWbnVal(progressVal[directionAlias]);
            var newVal;
    
            const steps = this.steps;
            if (steps.length) {
                wbnVal = this._wbnValToStep(wbnVal);
                newVal = this._wbnValToProgVal(wbnVal);
            } else {
                newVal = progressVal;
            }
    
            this._updateValue(newVal, wbnVal)
                .then(() => { this._updateHandle(newVal) })
                .then(() => { this._updateBindings() })
                //.then(() => { this._refreshUI(); })
            res(this);
        });
       
    }

}
    
