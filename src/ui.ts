import { Options, CSSNamespace } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

export class SliderUI {
    
    parent: HTMLElement;
    progressElem: HTMLInputElement;
    tooltip: HTMLElement;
    container: HTMLElement;
    handle: Element;
    config: Options;
    slider: any;
    steps: number[];
    ticks: Element[];
    tickOn: number | null;
    progressDrag: boolean;

    constructor(parent: any, config: Options, slider: any) {
        this.slider = slider;
        this.config = config;
        this.parent = parent;
        
        this._createElements()
            ._createSteps()
            ._createTicks()
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
        this.ticks.forEach((tick) => tick.remove());
        this.steps = [];
        
    }

    _createElements() {
        this.container = __wbn$().create('div',true).elem;
        this.parent.appendChild(this.container);
        this.container.classList.add(CSSNamespace + 'container');

        const _progressElem = __wbn$().create('progress', true)
            .setClass(`${CSSNamespace}slider`)
            .setAttr('value', this.config.defaultValue.toString())
            .elem;
        this.container.appendChild(_progressElem);

        const handle = this.config.handle;
        const _handleElem = __wbn$().create('div', true)
            .setClass(`${CSSNamespace}handle`)
            .elem;

        this.container.appendChild(_handleElem);
                
        Object.assign(this, {
            container: this.container,
            progressElem: _progressElem,
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
            return (handleConfig[dimension] == 'auto' ? elemHeight * 2 : handleConfig[dimension]);
        }

        __wbn$(this.handle)
            .setStyle({
                'height': handleDimension('height'),
                'width': handleDimension('width'),
                'borderRadius': `${handleDimension('borderRadius')}px`,
                'top': this.progressElem.offsetTop - (handleDimension('height') / 2) + (elemHeight / 2)
            });

        (config.handle.show !== true) ? __wbn$(this.handle).hide() : __wbn$(this.handle).show();
        (config.ribbon.show !== true) ? this.progressElem.classList.add('hidden_ribbon') : this.progressElem.classList.remove('hidden_ribbon');
        
        return this;
    }

    _round = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1);

    _clamp = (val, min, max) => { return val > max ? max : val < min ? min : val; };

    _createSteps() {
        const ui = this.UI();

        const ticks = this.slider.config.ticks;
        var tickData = ticks.data;

        if (tickData.length == 0 || ticks.snap === false) {

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
            me.config.onDragStart(me);
            me.progressDrag = true;
            me._updateProgress(e);
            me.config.onDrag(me.slider);
        }).on(['mousemove', 'touchmove'], (e) => {
            me._updateProgress(e);
            me.config.onDrag(me.slider);
        },{passive:false});
        
        __wbn$(document).on(['mouseup','touchend'], (e) => { if(me.progressDrag) { me.config.onDragEnd(me.slider); } me.progressDrag = false; });
        document.addEventListener('mousemove', (e) => { me._updateProgress(e);me.config.onDrag(me.slider); });

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
    
    _createTicks() {
        const ticks = this.slider.config.ticks;
        var tickData = ticks.data;
        const uniq = (val, i, self) => { return self.indexOf(val) === i };
        tickData.sort((a,b) => (a.value > b.value) ? 1 : -1).filter(uniq);
        this.ticks = [];
        if (tickData.length === 0) return this;

        const me = this;
        

        var ticksAndSteps: any[] = tickData.map((tick, i) => { return tick.value }).sort();
        
        const ui = this.UI();

        ticksAndSteps.forEach((tick, i) => {
            
            const tickValue = tickData[i]?.value || tick;
            
            if (tickValue < ui.min || tickValue > ui.max) return;

            
            let tickLabel = this._valOrFunc(tickData[i]?.label?.text,[tickData[i]?.value,i],tickData[i]?.value); 
            let tickStyle = {
                ...this._valOrFunc(tickData[i]?.label?.style,[tickData[i]?.value,i],{}),
                ...this._valOrFunc(ticks.style,[tickData[i]?.value,i],{})
            };

            let tickPosition = tickData[i]?.position || ticks.position;

            const containerRect = this.container.getBoundingClientRect();
            
            if (tickPosition == 'auto') {
                tickPosition = ((containerRect.bottom + 30 > window.innerHeight) ? 'top' : 'bottom');
            }
            
            var tickEle = __wbn$().create('div', true)
                .setStyle(tickStyle)
                .setClass(`${CSSNamespace}tick`)
                .setAttr('wbn-value', tickValue)
                .html(tickLabel)
                .elem;

            me.container.appendChild(tickEle);

            let tickX = me._positionTick(tickEle, tickValue, tickData[i],i);
            me.ticks.push(tickEle);
        });
        
        const heightElement = this.ticks.length > 0 ? this.ticks[0].getBoundingClientRect().height : this.handle.getBoundingClientRect().height 
        const containerPadding = (heightElement / 2) - (ui.progressRect.height / 2);
        
        __wbn$(this.container)
                .setStyle({
                    'paddingTop' : containerPadding,
                    'paddingBottom' : containerPadding,
                    'paddingLeft':this.ticks[0].getBoundingClientRect().width / 2,
                    'width':ui.progressWidth-this.ticks[0].getBoundingClientRect().width / 2
                });
        this._refreshUI();
        return this;
    }

    _positionTick(tickEle, tickValue, tickData, tickIndex) {
        const ui = this.UI();
        const me = this;
        var tickX = (tickValue - ui.min) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft;
        var tickLeft = tickX - (tickEle.getBoundingClientRect().width / 2);
        tickEle.style.left = tickLeft;
        
        const handleRect = this.handle.getBoundingClientRect();
        
        const handleTop = __wbn$(this.handle).elem.offsetTop;
        const handleBottom = handleTop + handleRect.height;
        
        const tickHeight = tickEle.getBoundingClientRect().height;
        
        let tickPosition = tickData?.position || this.config.ticks.position;
        let tickStyle = tickData?.style || this.config.ticks.style;
        const containerRect = this.container.getBoundingClientRect();
        
        if (tickPosition == 'auto') {
            tickPosition = tickStyle == 'scale' ? ((containerRect.bottom + 30 > window.innerHeight) ? 'top' : 'bottom') : 'center';
        }
        
        const tickTop = tickPosition == 'center' ? this.progressElem.offsetTop - (tickHeight / 2) + (this.config.height / 2) : (tickPosition == 'bottom' ? handleBottom + 1 : handleTop - tickHeight - 1);  
        
        tickEle.style.top = tickTop;

        if (this.config.ticks.labelsClickable !== false) {
            var _tickClick = (e) => {
                me._updateTicks(tickValue)
                  ._updateValue(this._wbnValToProgVal(tickValue),tickValue)
                  ._updateBindings();
                tickEle.classList.add('wbn_selected');
                this.config.ticks.onTick(tickValue,tickData,tickEle,tickIndex,this.slider);
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
        this.ticks.forEach((tick) => { (tick.getAttribute('wbn-value') == val) ? tick.classList.add('wbn_selected') : tick.classList.remove('wbn_selected'); });
        return this;
    }
    
    _createTooltip() {
        const tooltipConfig = this.slider.config.tooltip;
        
        if (tooltipConfig.show === false) return this;
        
       
        var position = tooltipConfig.position;
        const containerRect = this.container.getBoundingClientRect();
        if (position == 'auto') {
           position = (containerRect.top - 30 < 0) ? 'bottom' : 'top';
        }
        
        const _tooltip = __wbn$().create('div',true)
                                 .setClass(`${CSSNamespace}tooltip ${position}`)
                                 .elem;
        

                 
        this.container.appendChild(_tooltip);
        
        this.tickOn = null;
        if (this.config.tooltip.ticks.show === true) {
            const tooltipConfig = this.config.tooltip.ticks;
            this.ticks.forEach((tickEle,i) => {
                __wbn$(tickEle).on('mouseover',(e) => { 
                    this.tickOn = i;
                    this._showTooltip(_tooltip,position,e.clientX || e.touches[0].clientX,this.tickOn);
                }).on('mouseout',() => { 
                    this.tickOn = null; 
                });
            
            });
        }
        
        [this.container,document].forEach((elem) => {
            __wbn$(elem).on(['mouseover','mousemove','touchmove','touchstart'],(e: any) => {
                if (this.progressDrag || e.currentTarget == this.container) this._showTooltip(_tooltip,position,e.clientX || e.touches[0].clientX,this.tickOn);
            }).on(['touchend','mouseup','mouseout'],() => {
                _tooltip.style.display = 'none'; 
            });
        });
        
        
        
        
        this.tooltip = _tooltip;
        
        return this;
        
    }

    _showTooltip(_tooltip: HTMLElement,position: string,tooltipLeft: number,tickIndex?: number | null) {
        const tooltipConfig = this.slider.config.tooltip;
        const ui = this.UI();
        
        const _offsetLeft: number = tooltipLeft;
        const _parentOffsetLeft = ui.progressLeft || 0;
        const _parentWidth: number = ui.progressWidth;
        const _progValue = Math.round(((_offsetLeft - _parentOffsetLeft) / _parentWidth) * 100).toFixed(2).toString();
        
        var wbnVal = this._progValToWbnVal(_progValue); 
        if (this.slider.ui.steps.length > 0) {
            wbnVal = this.slider.ui._wbnValToStep(wbnVal);
        }
             
        var _tooltipText = wbnVal.toString();
        var labelConfig = tickIndex !== null ? tooltipConfig.ticks.label : tooltipConfig.label;
        
        if (labelConfig) {
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
        
        const _tooltipLeft = (wbnVal - ui.min) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft - (_tooltip.clientWidth / 2);
        const _tooltipTop = (position == 'bottom') ? this.container.offsetTop + this.container.getBoundingClientRect().height + 2 : this.container.offsetTop - _tooltip.clientHeight;
        
        Object.assign(_tooltip.style,{
            left: _tooltipLeft,
            top: _tooltipTop
        });
        

        
    }

    _updateHandle(val) {
        const ui = this.UI();
        const handleWidth = this.handle.getBoundingClientRect().width;
        const handleLeft = this.progressElem.offsetLeft - handleWidth / 2 + this._clamp(val / 100, 0, 1) * ui.progressWidth;
        __wbn$(this.handle)
            .setStyle({ 'left': handleLeft });
        return this;
    }

    _refreshUI() {
        const tickData = this.slider.config.ticks.data;
        const progressElem = this.progressElem;
        const progressValue = progressElem.value;
        this.container.style.width = (this.parent.getBoundingClientRect().width - (this.ticks.length > 0 ? this.ticks[0].getBoundingClientRect().width / 2 : 0)).toString();
        this.ticks.forEach((tick, i) => {
            this._positionTick(tick, tickData[i] ? tickData[i].value : tick, tickData[i], i);
        });
        this._responsiveUI()._updateHandle(progressValue);
    }

    _responsiveUI() {
        if (this.config.responsive === false) return this;
        const ui = this.UI();
        let lastRect;
        this.ticks.forEach((tick, i) => {
            var tickRect = tick.getBoundingClientRect();
            __wbn$(tick).setStyle({ visibility: (lastRect && tickRect.left <= lastRect.right) ? 'hidden' : 'visible' });
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

        const progressValue = Math.round((clientX - ui.progressLeft) / ui.progressWidth * 100);
        var wbnValue = this._progValToWbnVal(progressValue);
        var newValue;

        const steps = this.steps;
        if (steps.length) {
            wbnValue = this._wbnValToStep(wbnValue);
            newValue = this._wbnValToProgVal(wbnValue);
        } else {
            newValue = progressValue;
        }

        this._updateValue(newValue, wbnValue)
            ._updateHandle(newValue)
            ._updateBindings();
        return this;
       
    }

}