import { Options, CSSNamespace, Direction } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

export class SliderUI {
    
    parent: HTMLElement;
    direction: Direction;
    progressElem: HTMLInputElement;
    ribbon: HTMLElement;
    tooltip: HTMLElement;
    container: HTMLElement;
    handle: Element;
    config: Options;
    slider: any;
    steps: number[];
    tickLabels: Element[];
    tickMarks: Element[];
    markSteps: number[];
    tickOn: number | null;
    tickVal: any;
    progressDrag: boolean;

    constructor(parent: any, config: Options, slider: any) {
        this.slider = slider;
        this.config = config;
        this.parent = parent;
        
        this._createElements()
            ._createSteps()
            ._createTickLabels()
            ._createTickMarks()
            ._createTooltip()
            ._responsiveUI()
            .UI();
            
        return this;
    }

    UI() {
        const config = this.config;
        const progressRect = this.progressElem.getBoundingClientRect();
        const progressLeft = progressRect.left;
        const progressWidth = progressRect.width;
        
        return {
            height: config.height,
            progressDrag: this.progressDrag,
            progressRect: progressRect,
            progressLeft: progressRect.left,
            progressRight: progressRect.right,
            progressWidth: progressRect.width,
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
        this.container = __wbn$().create('div',true).elem;
        this.parent.appendChild(this.container);
        this.container.classList.add(CSSNamespace + 'container');
        
        this.direction = this.config.direction;
        const directionToCSS = {
            'left':'rtl',
            'down':'rtl',
            'right':'ltr',
            'up':'ltr'
        }
        
        const _progressElem = __wbn$().create('progress', true)
            .setClass(`${CSSNamespace}slider`)
            .setAttr('value', this.config.defaultValue.toString())
            .setStyle({direction:directionToCSS[this.direction]})
            .elem;
        this.container.appendChild(_progressElem);
        
        const _ribbonElem = __wbn$().create('div',true).setClass(`${CSSNamespace}ribbon`).elem;
        this.container.appendChild(_ribbonElem);
        
        const handle = this.config.handle;
        const _handleElem = __wbn$().create('div', true)
            .setClass(`${CSSNamespace}handle ${handle.className || ''}`)
            .setStyle(handle.style || {})
            .elem;

        this.container.appendChild(_handleElem);
                
        Object.assign(this, {
            container: this.container,
            progressElem: _progressElem,
            ribbon:_ribbonElem,
            handle: _handleElem
        });

        this._assignAttributes()._assignEvents();
        
        return this;
    }

    update() {
        this._assignAttributes();
        this._refreshUI();
        return this;
    }

    _assignAttributes() {
        const ui = this.UI();
        const config = this.config;
        
        __wbn$(this.progressElem)
            .setStyle({ 'height': ui.height })
            .setAttr('min', '0')
            .setAttr('max', '100')
            .setAttr('wbn-min', ui.min.toString())
            .setAttr('wbn-max', ui.max.toString());
        
        var cssVars = {
          '--background-color':[this.progressElem,config.backgroundColor],
          '--ribbon-color':[this.progressElem,config.ribbon.color || config.handle.color],
          '--handle-color':[this.handle,config.handle.color],
          '--hover-ribbon-color':[this.container,config.ribbon.hoverColor || config.hoverColor || config.ribbon.color || null],
          '--hover-handle-color':[this.container,config.handle.hoverColor || config.hoverColor || config.ribbon.hoverColor || config.handle.color || null],
        };
        
        
        for (const [key, [ele,value]] of Object.entries(cssVars)) {
            var thisValue = value;
            if (typeof thisValue === 'function') {
                thisValue = thisValue(this.slider);
            }
            if (value && ele) ele['style'].setProperty(key,`${thisValue}`);
        }
        
        const elemHeight    = config.height;
        const handleConfig  = config.handle;
        
        const handleDimension = (dimension) => {
            return (handleConfig[dimension] === null ? elemHeight * 2 : handleConfig[dimension]);
        }

        __wbn$(this.handle)
            .setStyle({
                'height': handleDimension('height'),
                'width': handleDimension('width'),
                'borderRadius': `${handleDimension('borderRadius')}px`,
                'top': this.progressElem.offsetTop - (this.handle.getBoundingClientRect().height / 2) + (elemHeight / 2) + config.handle.position
            });
        
        (config.handle.show !== true) ? __wbn$(this.handle).hide() : __wbn$(this.handle).show();
        (config.ribbon.show !== true) ? this.progressElem.classList.add('hidden_ribbon') : this.progressElem.classList.remove('hidden_ribbon');
        
        return this;
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
        const me = this;
        const ui = this.UI();
        __wbn$(this.container).on(['mousedown','touchstart'], (e) => {
            document.body.classList.add(`${CSSNamespace}select_disabled`);
            me.config.onDragStart(me);
            me.progressDrag = true;
            me._updateProgress(e);
            me.config.onDrag(me.slider);
        }).on(['mousemove', 'touchmove'], (e) => {
            me._updateProgress(e);
            me.config.onDrag(me.slider);
        },{passive:false});
        
        __wbn$(document).on(['mouseup','touchend'], (e) => { 
            if(me.progressDrag) me.config.onDragEnd(me.slider); 
            me.progressDrag = false;
            document.body.classList.remove(`${CSSNamespace}select_disabled`); 
        });
        
        document.addEventListener('mousemove', (e) => { 
            me._updateProgress(e);
            me.config.onDrag(me.slider); 
        });

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
        return this;
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
            //if (this.markSteps.indexOf(markMax) < 0) this.markSteps.push(markMax);
            
            markSteps.forEach((markValue) => {
                var markEle = __wbn$().create('div',true)
                    .setClass(`${CSSNamespace}tick_mark`)
                    .setStyle({
                        height: markSet.height,
                        width: `${markSet.width}px`,
                        borderRadius: `${markSet.borderRadius}px`,
                        backgroundColor: markSet.color
                     })
                    .elem;    
                this.container.appendChild(markEle);
                
                Object.assign(markEle.style,markSet.style);
                
                let markPosition = markSet.position;
                const markTop = this.progressElem.offsetTop + (ui.progressRect.height/2) - (markEle.getBoundingClientRect().height/2) + markPosition;
                markEle.style.top = markTop;
                
                this.tickMarks.push(markEle);
                this._positionTickMark(markEle,markValue);
            });
            
            this.markSteps = this.markSteps.concat(markSteps);

           /*
           range:{
                        step:0.25
                    },
                    height:10,
                    width:1,
                    borderRadius:0,
                    position:10,
                    style: {
                        
                    } */
                    
            
           
            
        });
        this._refreshUI();
        return this;
        
    }
    
    _positionTickMark(markEle: any, markValue: number) {
        const ui = this.UI();
        const tickPosX = {
            'right':(markValue - ui.min) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft,
            'left':(ui.max - markValue) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft
        }
        
        var tickMarkX = tickPosX[this.direction];
        var tickMarkLeft = tickMarkX - (markEle.getBoundingClientRect().width / 2);
        markEle.style.left = tickMarkLeft;
    }
    
    _createTickLabels() {
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
            
            const tickValue = tickData[i]?.value || tick;
            
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
        
        const heightElement = this.tickLabels.length > 0 ? this.tickLabels[0].getBoundingClientRect().height : this.handle.getBoundingClientRect().height 
        const containerPadding = (heightElement / 2) - (ui.progressRect.height / 2);
        
        __wbn$(this.container)
                .setStyle({
                    'paddingTop' : containerPadding,
                    'paddingBottom' : containerPadding,
                    'paddingLeft':this.tickLabels[0].getBoundingClientRect().width / 2,
                    'width':ui.progressWidth-this.tickLabels[0].getBoundingClientRect().width / 2
                });
        
        return this;
    }

    _positionTickLabel(tickEle, tickValue, tickData, tickIndex) {
        const ui = this.UI();
        const me = this;
        const tickLabels = this.config.ticks.labels;
        
        const tickPosX = {
            'right':(tickValue - ui.min) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft,
            'left':(ui.max - tickValue) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft
        }
        
        var tickX = tickPosX[this.direction];
        var tickLeft = tickX - (tickEle.getBoundingClientRect().width / 2);
        tickEle.style.left = tickLeft;
        
        const handleRect = this.handle.getBoundingClientRect();
        
        const handleTop = this.config.handle.show ? __wbn$(this.handle).elem.offsetTop : this.progressElem.offsetTop;
        const handleBottom = this.config.handle.show ? handleTop + handleRect.height : this.progressElem.offsetTop + ui.progressRect.height;
        
        const tickHeight = tickEle.getBoundingClientRect().height;
        
        let tickPosition = tickLabels.position;
        tickPosition = tickPosition === null ? this.progressElem.offsetTop + ui.progressRect.height + 4 : tickPosition;        
        const tickTop = this.progressElem.offsetTop + (ui.progressRect.height/2) - (tickHeight/2) + tickPosition;

        tickEle.style.top = tickTop;
        if (tickLabels.labelsClickable !== false) {
            const selectedEvent = new CustomEvent('selected');
            const deselectedEvent = new CustomEvent('deselected');
            var _tickClick = (e) => {
                this.tickLabels.forEach((elem) => elem.dispatchEvent(deselectedEvent));
                me._updateTicks(tickValue)
                  ._updateValue(this._wbnValToProgVal(tickValue),tickValue)
                  ._updateBindings();
                tickEle.classList.add('wbn_selected');
                tickEle.dispatchEvent(selectedEvent);
                tickLabels.onTick(tickValue,tickData,tickEle,tickIndex,this.slider);
                e.stopPropagation();
                e.preventDefault();
            }
            if (tickEle._eventHandler) tickEle.removeEventListener('click', tickEle._eventHandler);
            tickEle.classList.add('clickable');
            tickEle.addEventListener('click', _tickClick);
            tickEle._eventHandler = _tickClick;
        }
        
        return tickX;
    }
    
    _updateTicks(val) {
        const selectedEvent = new CustomEvent('selected');
        const deselectedEvent = new CustomEvent('deselected');
        this.tickLabels.forEach((tick) => { (tick.getAttribute('wbn-value') == val) ? [tick.classList.add('wbn_selected'),tick.dispatchEvent(selectedEvent)] : [tick.classList.remove('wbn_selected'),tick.dispatchEvent(deselectedEvent)] });
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
        if (this.config.tooltips.ticks.show === true) {
            const tooltipConfig = this.config.tooltips.ticks;
            this.tickLabels.forEach((tickEle,i) => {
                __wbn$(tickEle).on('mouseover',(e) => { 
                    this.tickOn = i;
                    this.tickVal = this.config.ticks.labels.data ? this.config.ticks.labels.data[i].value : null;
                    this._showTooltip(_tooltip,e.clientX || e.touches[0].clientX,this.tickOn,this.tickVal);
                }).on('mouseout',() => { 
                    this.tickVal = null;
                    this.tickOn = null; 
                });
            
            });
        }
        
        [this.container,document].forEach((elem) => {
            __wbn$(elem).on(['mouseover','mousemove','touchmove','touchstart'],(e: any) => {
                if (this.progressDrag || e.currentTarget == this.container) this._showTooltip(_tooltip,e.clientX || e.touches[0].clientX,this.tickOn,this.tickVal);
            }).on(['touchend','mouseup','mouseout'],() => {
                _tooltip.style.display = 'none'; 
            });
        });

        this.tooltip = _tooltip;
        return this;
    }

    _showTooltip(_tooltip: HTMLElement,tooltipLeft: number,tickIndex?: number | null,tickVal?: string | null) {
        const tooltipConfig = this.slider.config.tooltips;
        let tooltipPosition = tooltipConfig.position;
        const ui = this.UI();
        
        const _offsetLeft: number = tooltipLeft;
        const _parentOffsetLeft = ui.progressLeft || 0;
        const _parentOffsetRight = ui.progressRight || 0;
        const _parentWidth: number = ui.progressWidth;
        const _progValue = {
            'right':Math.round(((_offsetLeft - _parentOffsetLeft) / _parentWidth) * 100),
            'left':Math.round(((_parentOffsetRight - _offsetLeft) / _parentWidth) * 100),
        }
        
        var wbnVal;
        
        if (tickVal) {
            wbnVal = tickVal;
        } else {
            wbnVal = this._progValToWbnVal(_progValue[this.direction].toFixed(2).toString()); 
            if (this.slider.ui.steps.length > 0) {
                wbnVal = this.slider.ui._wbnValToStep(wbnVal);
            }
        
        }
             
        var _tooltipText = wbnVal.toString();
        var labelConfig = tickIndex !== null ? tooltipConfig.ticks.label : tooltipConfig.label;
        
        if (labelConfig.text) {
            if (typeof labelConfig.text === 'function') {
                _tooltipText = labelConfig.text(wbnVal,tickIndex);
            } else {
                _tooltipText = labelConfig.text;
            }
        }
        
        const _tooltipStyle = {
            ...this._valOrFunc(labelConfig.style,[wbnVal,tickIndex],{}),
            ...this._valOrFunc(tooltipConfig.style,[wbnVal,tickIndex],{})
        };
        
        __wbn$(_tooltip).setStyle(_tooltipStyle);
        
        _tooltip.innerHTML = _tooltipText;
        _tooltip.style.display = 'block';
        
        const _tooltipLeft = {
            'right':(wbnVal - ui.min) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft - (_tooltip.clientWidth / 2),
            'left':(ui.max - wbnVal) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft - (_tooltip.clientWidth / 2)
        };
        
        const _tooltipPosition = tooltipPosition === null ? -(_tooltip.clientHeight/2) - 4 : tooltipPosition;   
        const _tooltipTop = this.progressElem.offsetTop + (ui.progressRect.height/2) - (_tooltip.clientHeight/2) + _tooltipPosition;
        
        Object.assign(_tooltip.style,{
            left: _tooltipLeft[this.direction],
            top: _tooltipTop
        });
    }

    _updateHandle(val) {
        const ui = this.UI();
        const handleWidth = this.handle.getBoundingClientRect().width;
        const handleLeft = {
            'right':this.progressElem.offsetLeft - handleWidth / 2 + this._clamp(val / 100, 0, 1) * ui.progressWidth,
            'left':(this.progressElem.offsetLeft+ui.progressWidth) - handleWidth / 2 - this._clamp(val / 100, 0, 1) * ui.progressWidth 
        };
        const ribbonWidth = {
            'right':handleLeft[this.direction] - this.progressElem.offsetLeft + handleWidth / 2,
            'left':(this.progressElem.offsetLeft+ui.progressWidth) - handleLeft[this.direction] - handleWidth / 2,
        }
        
        const ribbonLeft = {
            'right':this.progressElem.offsetLeft,
            'left':(this.progressElem.offsetLeft+ui.progressWidth)-ribbonWidth['left']
        }
        
        __wbn$(this.ribbon)
            .setStyle({
                'width': ribbonWidth[this.direction],
                'left': ribbonLeft[this.direction] 
            }); 
        __wbn$(this.handle)
            .setStyle({ 'left': handleLeft[this.direction] });
        return this;
    }

    _refreshUI() {
        const tickLabelData = this.slider.config.ticks.labels.data;
        const progressElem = this.progressElem;
        const progressValue = progressElem.value;
        this.container.style.width = (this.parent.getBoundingClientRect().width - (this.tickLabels.length > 0 ? this.tickLabels[0].getBoundingClientRect().width / 2 : 0)).toString();
        this.tickLabels.forEach((tick, i) => {
            this._positionTickLabel(tick, tickLabelData[i] ? tickLabelData[i].value : tick, tickLabelData[i], i);
        });

        this.tickMarks.forEach((markEle,i) => {
            this._positionTickMark(markEle,this.markSteps[i]);
        });
        this._responsiveUI()._updateHandle(progressValue);
    }

    _responsiveUI() {
        if (this.config.responsive === false) return this;
        const ui = this.UI();
        let lastRect;
        this.tickLabels.forEach((tick, i) => {
            var tickRect = tick.getBoundingClientRect();
            __wbn$(tick).setStyle({ visibility: (lastRect && (this.direction == 'right' ? tickRect.left <= lastRect.right : tickRect.right >= lastRect.left)) ? 'hidden' : 'visible' });
            if (__wbn$(tick).getStyle('visibility') != 'hidden') lastRect = tickRect;
        });
        return this;
    }

    _wbnValToProgVal(wbnVal) {
        return this.slider._wbnValToProgVal(wbnVal);
    }

    _updateValue(val, wbnVal) {
        this.slider._updateValue(val, wbnVal);
        return this;
    }

    _updateBindings() {
        this.slider._updateBindings();
        return this;
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
    
    _updateProgress(e: any, tickX?: number) {
        const ui = this.UI();
        const progressElem = this.progressElem

        if (!this.progressDrag && !tickX && e.touches === undefined) return
        const clientX = e ? e.clientX || e.touches[0].clientX : tickX;
        
        const progressVal = {
            'right':Math.round((clientX - ui.progressLeft) / ui.progressWidth * 100),
            'left':Math.round((ui.progressRight - clientX) / ui.progressWidth * 100)
        }

        var wbnVal = this._progValToWbnVal(progressVal[this.direction]);
        var newVal;

        const steps = this.steps;
        if (steps.length) {
            wbnVal = this._wbnValToStep(wbnVal);
            newVal = this._wbnValToProgVal(wbnVal);
        } else {
            newVal = progressVal;
        }

        this._updateValue(newVal, wbnVal)
            ._updateHandle(newVal)
            ._updateBindings();
        return this;
       
    }

}