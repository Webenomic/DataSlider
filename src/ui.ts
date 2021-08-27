import { Options, CSSNamespace, Direction, Orientation } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

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
    uiCreated: Promise<SliderUI>;

    constructor(parent: any, config: Options, slider: any) {
        this.slider = slider;
        this.config = config;
        this.parent = parent;
        this.focused = false;
        
        this.uiCreated = new Promise((res,rej) => {
            
            console.log('creating elements');
            
            this._createElements()
            .then(() => {
                console.log('assigning attributes');
                this._assignAttributes()
            }).then(() => {
                this._createSteps()
            }).then(() => {
                this._createCaps()
            }).then(() => {
                console.log('creating tick labels');
                this._createTickLabels()
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
                this.UI();
            });
            res(this);
        
        });
        
        return this;
        
    }

    UI() {
        const config = this.config;
        const parentHeight = parseInt(window.getComputedStyle(this.parent, null).getPropertyValue('height')); 
        const parentWidth = parseInt(window.getComputedStyle(this.parent, null).getPropertyValue('width')); 
        const containerRect = this.container.getBoundingClientRect();
        const progressRect = this.progressElem.getBoundingClientRect();
        const progressLeft = progressRect.left;
        const progressTop = progressRect.top;
        const progressBottom = progressRect.bottom;
        const progressLength = this.vertical ? progressRect.height : progressRect.width;
        const progressThickness = this.vertical ? progressRect.width : progressRect.height;
        const progressOffset = this.vertical ? this.progressElem.offsetTop : this.progressElem.offsetLeft;
        const positionProperty  = this.vertical ? 'top' : 'left'
        const positionOffsetProperty = this.vertical ? 'offsetLeft' : 'offsetTop';
        const thicknessProperty  = this.vertical ? 'width' : 'height'
        const directionAlias = this.vertical ? (this.direction == 'up' ? 'left' : 'right') : this.direction;
        
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
        this.progressElem.remove();
        this.handle.remove();
        this.tickLabels.forEach((tick) => tick.remove());
        this.steps = [];
        
    }

    _createElements() {
        
        return new Promise((res,rej) => {
            
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
        
        return new Promise((res,rej) => {
            const ui = this.UI();
            const config = this.config;
            
            __wbn$(this.progressElem)
                .setStyle({ 'height': ui.height })
                .setAttr('min', '0')
                .setAttr('max', '100')
                .setAttr('wbn-min', ui.min.toString())
                .setAttr('wbn-max', ui.max.toString());
            
            var cssVars = {
              '--background-color':[this.progressElem,config.bar.backgroundColor],
              '--ribbon-color':[this.progressElem,config.ribbon.color || config.handle.color],
              '--handle-color':[this.handle,config.handle.color],
              '--hover-ribbon-color':[this.container,config.ribbon.hoverColor || config.ribbon.color || null],
              '--hover-handle-color':[this.container,config.handle.hoverColor || config.ribbon.hoverColor || config.handle.color || null],
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
        const elemHeight    = this.config.bar.thickness;
        const handleConfig  = this.config.handle;
        const handleDimension = (dimension) => {
            var thisDimension = this._valOrFunc(handleConfig[dimension],[this.slider,this.slider.value],null);
            return (thisDimension === null ? elemHeight * 2 : thisDimension);
        }
        
        const handlePos = this.progressElem[this.vertical ? 'offsetLeft' : 'offsetTop'] - 
                            (this.handle.getBoundingClientRect()[this.vertical ? 'width' : 'height'] / 2) + 
                            (this.vertical ? 0 : elemHeight / 2) + 
                            this._valOrFunc(this.config.handle.position,[this.slider,this.slider.value],0);
        
        var handleCoreStyle = {
            'height': handleDimension('height'),
            'width': handleDimension('width'),
            'borderRadius': `${handleDimension('borderRadius')}px`,
        }
        
        const handleAdditionalStyle = this._valOrFunc(handleConfig.style,[this.slider,this.slider.value],{});
        
        Object.assign(handleCoreStyle,handleAdditionalStyle);
        Object.assign(handleCoreStyle,this.vertical ? { 'left':handlePos } : {'top':handlePos});
        
        __wbn$(this.handle)
            .setStyle(handleCoreStyle);
            
        if (handleConfig.label) {
            const labelConfig = handleConfig.label;
            const handleRect = this.handle.getBoundingClientRect();
            const labelRect = this.handleLabel.getBoundingClientRect();
            const labelPosition = this._valOrFunc(labelConfig.position,[this.slider,this.slider.value],0);
            
            __wbn$(this.handleLabel)
                .setStyle({
                  'left':handleRect.width/2 - labelRect.width/2 + (this.vertical ? labelPosition : 0),
                  'top':handleRect.height/2 - labelRect.height/2 + (this.vertical ? 0 : labelPosition)
                }); 

            
        }
    }
    
    _round = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1);

    _clamp = (val, min, max) => { return val > max ? max : val < min ? min : val; };

    _createSteps() {
        const ui = this.UI();

        const tickLabels = this.slider.config.ticks.labels;
        var tickData = tickLabels.data;

        if (tickData.length == 0 || tickLabels.snap === false) {

            var step = this.slider.config.range.step;

            var increment = 1;
            var stepVal = (typeof step === 'function') ? step(increment) : step;

            var steps: number[] = [];
            steps[0] = ui.min;

            for (let i: number = ui.min; i <= ui.max; i += (typeof step === 'function') ? 1 : stepVal) {
                var newStep = (typeof step === 'function') ? step(increment) : i;
                steps.push(this._round(newStep, ui.decimals));
                increment += 1;
            }
            steps.push(ui.max);

        } else {
            steps = tickData.map((tick, i) => { return tick.value; });
        }
        
        this.steps = steps;
        return this;
    }

    _assignEvents() {

        return new Promise((res,rej) => {         
            const me = this;
            const ui = this.UI();
            __wbn$(this.container).on(['mousedown','touchstart'], (e) => {
                if (this.tickVal) {
                    this.slider.update(this.tickVal);
                    return;
                }
                document.body.classList.add(`${CSSNamespace}select_disabled`);
                me.config.onDragStart(me);
                me.progressDrag = true;
                me._updateProgress(e);
                me.config.onDrag(me.slider);
            }).on(['mousemove', 'touchmove'], (e) => {
                if (this.tickVal) return;
                me._updateProgress(e);
                me.config.onDrag(me.slider);
            },{passive:false});
            
            __wbn$(document).on(['mouseup','touchend'], (e) => { 
                if(me.progressDrag) me.config.onDragEnd(me.slider); 
                me.progressDrag = false;
                document.body.classList.remove(`${CSSNamespace}select_disabled`); 
            });
            
            document.addEventListener('mousemove', (e) => { 
                me._updateProgress(e)
                    .then(() => { me.config.onDrag(me.slider) }); 
            });
            
            if (this.config.arrowKeys) {
                const arrowKeyCodes = {
                    'right': { 37: -1, 39: 1},
                    'left': { 37: 1, 39: -1},
                    'up': {38: 1, 40: -1},
                    'down':{38: -1, 40: 1}
                }
                
               
                const focusElements = this.tickLabels.concat([this.container,this.handle,this.progressElem]);
                focusElements.forEach((elem) => {
                    elem.addEventListener('focus',(e) => {
                        this.focused = true; 
                    });
                    elem.addEventListener('blur',(e) => {
                        this.focused = false; 
                    });
                });
                
                 document.addEventListener('keydown', (e) => {
                    var increment = arrowKeyCodes[this.direction][e.which];
                    if (increment && this.focused) {
                        if (e.shiftKey) increment *= 5;
                        var newValue = Number(this.slider.value) + (increment * Number(this.config.range.step));
                        this.slider.update(newValue);
                    }    
                });
                
                
                
            }
            
            document.querySelectorAll('input[wbn-bind]').forEach((ele: any) => {
                var eleBindVarName = ele.getAttribute('wbn-bind');
                var changeFunc = () => { window.wbnScope[eleBindVarName] = ele.value; };
                ele.addEventListener('change', changeFunc);
                ele.addEventListener('keyup', changeFunc);
                ele.addEventListener('blur', () => {
                    if (ele.value > ui.max) ele.value = ui.max;
                    if (ele.value < ui.min) ele.value = ui.min;
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
        const tickMarkConfig = this.slider.config.ticks.marks;
        const ui = this.UI();
        this.markSteps = [];
        this.tickMarks = [];
        tickMarkConfig.forEach((markSet) => {
            const markRange = markSet.range;
            
            var step = markRange?.step;

            var increment = 1;
            var stepVal = (typeof step === 'function') ? step(increment) : step;

            const markMin = markRange.min || ui.min;
            const markMax = markRange.max || ui.max;
            
            let markSteps: number[] = [];
            
            markSteps.push(markRange.min || ui.min);

            for (let i: number = markMin; i <= markMax; i += (typeof step === 'function') ? 1 : stepVal) {
                var newStep = (typeof step === 'function') ? step(increment) : i;
                markSteps.push(this._round(newStep, ui.decimals));
                increment += 1;
            }
            
            markSteps.forEach((markValue,i) => {
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
                
                const markStyle = this._valOrFunc(markSet?.style,[this.slider, markValue ,i],{});
                const markHoverStyle = this._valOrFunc(markSet?.hoverStyle,[this.slider, markValue ,i],markStyle);
                const markSelectedStyle = this._valOrFunc(markSet?.selectedStyle,[this.slider, markValue ,i],markStyle);
                
                Object.assign(markEle.style,markStyle); 
                
                this.container.appendChild(markEle);
                
                const thisMarkEle = __wbn$(markEle);
                
               thisMarkEle.on('mouseover',() => {
                    thisMarkEle.setStyle(markHoverStyle);  
                }).on('mouseout',() => {
                    thisMarkEle.setStyle(this.slider.value == markValue ? markSelectedStyle : markStyle);  
                }).on('selected',() => {
                    thisMarkEle.setStyle(markSelectedStyle);
                }).on('deselected',() => {
                     thisMarkEle.setStyle(markStyle);
                });
                
                let markPosition = this._valOrFunc(markSet.position,[this.slider, markValue, i],0);
                const markTop = (this.vertical ? ui.progressLeft : ui.progressTop) + (ui.progressThickness/2) - (markEle.getBoundingClientRect()[this.vertical ? 'width' : 'height']/2) + markPosition;
                markEle.style[this.vertical ? 'left' : 'top'] = markTop;
                 
                this.tickMarks.push(markEle);
                this._positionTickMark(markEle,markValue);
            });
            
            this.markSteps = this.markSteps.concat(markSteps);
        });
        this._refreshUI();
        return this;
        
    }
    
    _positionTickMark(markEle: any, markValue: number) {
        const ui = this.UI();
        
        //re-register default style if tickMark is in selected state
        const deselectedEvent = new CustomEvent('deselected');
        const selectedEvent = new CustomEvent('selected');
        if (markValue == this.slider.value) markEle.dispatchEvent(deselectedEvent);
        
        const markThickness = markEle.getBoundingClientRect()[this.vertical ? 'height' : 'width'];
        const tickPos = {
            'right':(markValue - ui.min) * ui.progressLength / (ui.max - ui.min) + ui.progressOffset,
            'left':(ui.max - markValue) * ui.progressLength / (ui.max - ui.min) + ui.progressOffset
        }

        var tickMarkPos = tickPos[ui.directionAlias];
        tickMarkPos = tickMarkPos - markThickness/2 + (this.vertical ? ui.progressThickness/2 : 0);
         
        markEle.style[ui.positionProperty] = tickMarkPos;
        
        //re-register selected state, if present
        if (markValue == this.slider.value) { 
            markEle.dispatchEvent(selectedEvent);
            this._updateHandle(this._wbnValToProgVal(markValue));
        }
    }
    
    _createTickLabels() {
        
        return new Promise((res,rej) => {
        
            const tickLabels = this.slider.config.ticks.labels;
            var tickData = tickLabels.data;
            const uniq = (val, i, self) => { return self.indexOf(val) === i };
            tickData.sort((a,b) => (a.value > b.value) ? 1 : -1).filter(uniq);
            this.tickLabels = [];
            if (tickData.length === 0) return this;
    
            const me = this;
            
            var ticksAndSteps: any[] = tickData.map((tick, i) => { return tick.value }).sort();
            const ui = this.UI();
            
            ticksAndSteps.forEach((tick, i) => {
                
                const tickValue = tickData[i]?.value !== undefined ? tickData[i]?.value : tick;
                
                if (tickValue < ui.min || tickValue > ui.max) return;
    
                let tickLabel = this._valOrFunc(tickData[i]?.label?.text,[tickData[i]?.value,i],tickData[i]?.value); 
                
                let tickClassName, tickStyle, tickHoverStyle, tickSelectedStyle;
            
                tickClassName = tickLabels.className || tick.className || ''; 
            
                let tickStyles = {
                    style: {},
                    hoverStyle: {},
                    selectedStyle: {}
                };
                
                ['style','hoverStyle','selectedStyle'].forEach((styleVar) => {
                    tickStyles[styleVar] = {
                        ...this._valOrFunc(tickData[i]?.label[styleVar],[tickData[i]?.value,i],{}),
                        ...this._valOrFunc(tickLabels[styleVar],[tickData[i]?.value,i],{})
                    }
                });
    
                const containerRect = this.container.getBoundingClientRect();
                            
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
    
                let tickX = me._positionTickLabel(tickEle.elem, tickValue, tickData[i],i);
                me.tickLabels.push(tickEle.elem);
                
                
            });
            
            const heightProperty = this.orientation == 'horizontal' ? 'height' : 'width';
            const heightElement = this.tickLabels.length > 0 ? this.tickLabels[0].getBoundingClientRect()[heightProperty] : this.handle.getBoundingClientRect()[heightProperty];
            
            const containerPadding = (heightElement / 2) - (ui.progressThickness / 2);
    
            res(this);
        })
    }

    _positionTickLabel(tickEle, tickValue, tickData, tickIndex) {
        const ui = this.UI();
        const me = this;
        const tickLabels = this.config.ticks.labels;
        
        const tickPos = {
            'right':(tickValue - ui.min) * ui.progressLength / (ui.max - ui.min) + ui.progressOffset,
            'left':(ui.max - tickValue) * ui.progressLength / (ui.max - ui.min) + ui.progressOffset
        }
        
        var tickFinalPos = tickPos[ui.directionAlias] - (tickEle.getBoundingClientRect()[this.vertical ? 'height' : 'width'] / 2) + (this.vertical ? ui.progressThickness/2 : 0);
        tickEle.style[ui.positionProperty] = tickFinalPos;
        
        const handleRect = this.handle.getBoundingClientRect();
        
        const handleTop = this.config.handle.show ? __wbn$(this.handle).elem.offsetTop : this.progressElem.offsetTop;
        const handleBottom = this.config.handle.show ? handleTop + handleRect.height : this.progressElem.offsetTop + ui.progressThickness;
        
        const tickHeight = tickEle.getBoundingClientRect()[this.vertical ? 'width' : 'height'];
        
        let tickPosition = this._valOrFunc(tickLabels.position,[this.slider,tickValue,tickIndex],0);
        var finalTickPos = tickPosition === null ? this.progressElem[ui.positionOffsetProperty] + ui.progressThickness + 4 : tickPosition;        
        
        if (this.vertical) {
            if (tickPosition == 0) {
                finalTickPos = finalTickPos - (ui.progressThickness)/2 - tickHeight/2;
            }
            if (tickPosition < 0) {
                finalTickPos -= ui.progressThickness + tickHeight;
            }
           
        } else {
             finalTickPos -= tickHeight/2;
        }
        
        finalTickPos = this.progressElem[ui.positionOffsetProperty] + (ui.progressThickness/2) + finalTickPos;
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
    
    async _updateTicks(val) {
        const ticksUpdated = new Promise((res,rej) => {
            const selectedEvent = new CustomEvent('selected');
            const deselectedEvent = new CustomEvent('deselected');
            this.tickLabels.concat(this.tickMarks).forEach((tick) => { (tick.getAttribute('wbn-value') == val) ? [tick.classList.add('wbn_selected'),tick.dispatchEvent(selectedEvent)] : [tick.classList.remove('wbn_selected'),tick.dispatchEvent(deselectedEvent)] });
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
            _capElement.style[this.vertical ? 'top' : 'left'] = ui.containerRect[capObj.prop] - (capObj.prop == 'right' ? _capElement.getBoundingClientRect()[this.vertical ? 'height' : 'width'] : 0);

            i == 0 ? [this.startCap = _capElement] : [this.endCap = _capElement];
            
            
        });
      
        return this;
    }
    
    _createTooltip() {
        const tooltipConfig = this.slider.config.tooltips;
        
        if (tooltipConfig.show === false) return this;
        
        const containerRect = this.container.getBoundingClientRect();
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
        const tooltipConfig = this.slider.config.tooltips;
       
        const ui = this.UI();
        
        const _offsetStart: number = tooltipStart;
        
        var _parentOffsetStart,_parentOffsetEnd;
        
        if (this.vertical) {
            _parentOffsetStart = ui.progressTop || 0;
            _parentOffsetEnd = ui.progressBottom || 0;
        } else {
            _parentOffsetStart = ui.progressLeft || 0;
            _parentOffsetEnd = ui.progressRight || 0;
        }
        
        const _progValue = {
            'right':((_offsetStart - _parentOffsetStart) / ui.progressLength) * 100,
            'left':((_parentOffsetEnd - _offsetStart) / ui.progressLength) * 100,
        }
        
        var wbnVal: number;
        
        if (tickVal || tickVal == '0') {
            wbnVal = Number(tickVal);
        } else {
            wbnVal = this._progValToWbnVal(_progValue[ui.directionAlias].toFixed(2).toString()); 
            if (this.slider.ui.steps.length > 0) {
                wbnVal = this.slider.ui._wbnValToStep(wbnVal);
            }
        
        }
             
        var labelConfig = tickIndex !== null ? tooltipConfig.ticks.label : tooltipConfig.label;
        var _tooltipText = this._valOrFunc(labelConfig.text,[this.slider,wbnVal,tickIndex],wbnVal);
        
        const _tooltipStyle = {
            ...this._valOrFunc(labelConfig.style,[this.slider,wbnVal,tickIndex],{}),
            ...this._valOrFunc(tooltipConfig.style,[this.slider,wbnVal,tickIndex],{})
        };
        
        __wbn$(_tooltip).setStyle(_tooltipStyle);
        
        _tooltip.innerHTML = _tooltipText;
        _tooltip.style.display = 'block';
        
        const _tooltipLeft = {
            'right':(wbnVal - ui.min) * ui.progressLength / (ui.max - ui.min) + ui.progressOffset - (_tooltip.clientWidth / 2),
            'left':(ui.max - wbnVal) * ui.progressLength / (ui.max - ui.min) + ui.progressOffset - (_tooltip.clientWidth / 2)
        };
        
        let tooltipPosition = this._valOrFunc(tooltipConfig.position,[this.slider,wbnVal],0);
        
        const _tooltipPosition = tooltipPosition === null ? -(_tooltip.clientHeight/2) - 4 : tooltipPosition;   
        const _tooltipTop = this.progressElem.offsetTop + (ui.progressThickness/2) - (_tooltip.clientHeight/2) + _tooltipPosition;
        
        var _finalStyle:{};
        
        if (this.vertical) {
            _finalStyle = {
                top: _tooltipLeft[ui.directionAlias],
                left: _tooltipTop
            }
        } else {
            _finalStyle = {
                left: _tooltipLeft[ui.directionAlias],
                top: _tooltipTop
            }
        }
        
        Object.assign(_tooltip.style,_finalStyle);
    }

    _updateHandle(val: number) {
        const ui = this.UI();
        this._positionHandle();
        const handleWidth = this.handle.getBoundingClientRect()[this.vertical ? 'height' : 'width'];
        const handleLeft = {
            'right':ui.progressOffset - handleWidth/2 + this._clamp(val / 100, 0, 1) * ui.progressLength,
            'left':(ui.progressOffset + ui.progressLength) - handleWidth/2 - this._clamp(val / 100, 0, 1) * ui.progressLength 
        };
        const ribbonWidth = {
            'right':handleLeft[ui.directionAlias] - ui.progressOffset + handleWidth / 2,
            'left':(ui.progressOffset+ui.progressLength) - handleLeft[ui.directionAlias] - handleWidth / 2,
        }
        
        const ribbonLeft = {
            'right':ui.progressOffset,
            'left':(ui.progressOffset+ui.progressLength)-ribbonWidth['left']
        }
        
        if (this.vertical) {
            __wbn$(this.ribbon)
                .setStyle({
                    'height': ribbonWidth[ui.directionAlias],
                    'top': ribbonLeft[ui.directionAlias] 
                }); 
            __wbn$(this.handle)
                .setStyle({ 'top': handleLeft[ui.directionAlias] + ui.progressThickness/2 });
        } else {
            __wbn$(this.ribbon)
                .setStyle({
                    'width': ribbonWidth[ui.directionAlias],
                    'left': ribbonLeft[ui.directionAlias] 
                }); 
            __wbn$(this.handle)
                .setStyle({ 'left': handleLeft[ui.directionAlias] });
        }
        
        if (this.config.handle.label ) {
            const labelConfig = this.config.handle.label;
            var labelHtml = this._valOrFunc(labelConfig.text,[this.slider,this.slider.value],this.slider.value);
            __wbn$(this.handleLabel).html(labelHtml);
                         
             var handleLabelStyle = this._valOrFunc(labelConfig.style,[this.slider,this.slider.value],{});
             Object.assign(this.handleLabel.style,handleLabelStyle);  
        }
        
        return this;
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
            this._positionTickLabel(tick, tickLabelData[i] ? tickLabelData[i].value : tick, tickLabelData[i], i);
        });

        this.tickMarks.forEach((markEle,i) => { 
            this._positionTickMark(markEle,this.markSteps[i]);
        });
        
        this._responsiveUI()._updateHandle(progressValue);
        if(this.slider.value) this.slider.update(this.slider.value);
        
        return this;
    }
    
    _constrainContainer() {
        const ui = this.UI();
        
        const container = __wbn$(this.container).elem;
        const containerRect = container.getBoundingClientRect();
        
        var boundaries = {
            'start': this.vertical ? 'top' : 'left',
            'end': this.vertical ? 'bottom' : 'right'
        };
        
        var boundaryStart = containerRect[boundaries.start];
        var boundaryEnd = containerRect[boundaries.end];

        this.tickLabels.concat(this.tickMarks).forEach((tick, i) => {
            var tickStart = tick.getBoundingClientRect()[boundaries.start];
            boundaryStart = tickStart < boundaryStart ? tickStart : boundaryStart;
            var tickEnd = tick.getBoundingClientRect()[boundaries.end];
            boundaryEnd = tickEnd > boundaryEnd ? tickEnd : boundaryEnd; 
        });
        
       boundaryStart = ui.containerRect[boundaries.start] - boundaryStart;
       boundaryEnd = boundaryEnd - ui.containerRect[boundaries.end];
       
       const capStart = (this.startCap ? this.startCap.getBoundingClientRect()[this.vertical ? 'height' : 'width'] : 0);
       const capEnd = (this.endCap ? this.endCap.getBoundingClientRect()[this.vertical ? 'height' : 'width'] : 0);
       const capTotal = capStart+capEnd;

       __wbn$(this.container).setStyle(this.vertical ? {
           height: ui.parentHeight - (boundaryEnd) - (boundaryStart) - 2 - capTotal,
           marginTop: (this.direction == 'down') ? boundaryStart+capStart : boundaryStart+capStart 
        } : {
           width: ui.parentWidth - (boundaryEnd) - (boundaryStart) - 2 - capTotal,
           marginLeft: boundaryStart + capStart
        });
        
        if (this.vertical) {
            __wbn$(this.progressElem).setStyle({
                width: ui.parentHeight - (boundaryEnd) - (boundaryStart) - 2 - capTotal,
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
                var tickRect = tick.getBoundingClientRect();
                __wbn$(tick).setStyle({ visibility: (lastRect && outOfBounds(tickRect)) ? 'hidden' : 'visible' });
                if (__wbn$(tick).getStyle('visibility') != 'hidden') lastRect = tickRect;
            });
        });
        return this;
    }

    _wbnValToProgVal(wbnVal) {
        return this.slider._wbnValToProgVal(wbnVal);
    }

    _updateValue(val, wbnVal) {
        return new Promise((res,rej) => {
            this.slider._updateValue(val, wbnVal)
            res(this);
        });
    }

    _updateBindings() {
        return this.slider._updateBindings();
    }
    
    _progValToWbnVal(progVal): number {
        const ui = this.UI();
        return this._round(this._clamp(ui.min + ((ui.max - ui.min) * progVal / 100), ui.min, ui.max), ui.decimals);
    }
    
    _wbnValToStep(wbnVal): number {
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
        
        return new Promise((res,rej) => {
            const ui = this.UI();
            const progressElem = this.progressElem;
    
            if (!this.progressDrag && !tickPos && e.touches === undefined) return
            const posProperty = this.vertical ? 'clientY' : 'clientX';
            const clientPos = e ? e[posProperty] || e.touches[0][posProperty] : tickPos;
            
            const progressVal = {
                'right':(clientPos - (this.vertical ? ui.progressTop : ui.progressLeft)) / ui.progressLength * 100,
                'left':((this.vertical ? ui.progressBottom : ui.progressRight) - clientPos) / ui.progressLength * 100
            }
            
            var wbnVal = this._progValToWbnVal(progressVal[ui.directionAlias]);
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
                .then(() => { this._refreshUI(); })
            return this;
        });
       
    }

}