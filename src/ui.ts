import { Options, CSSNamespace } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

export class SliderUI {
    
    progressElem: HTMLInputElement;
    tooltip: HTMLElement;
    container: HTMLElement;
    handle: Element;
    config: Options;
    slider: any;
    steps: number[];
    ticks: Element[];
    progressDrag: boolean;

    constructor(container: any, config: Options, slider: any) {
        this.slider = slider;
        this.config = config;
        this.container = container;
        
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
        
        __wbn$(this.progressElem)
            .setStyle({ 'height': ui.height })
            .setAttr('min', '0')
            .setAttr('max', '100')
            .setAttr('wbn-min', ui.min.toString())
            .setAttr('wbn-max', ui.max.toString());

        const elemHeight    = this.config.height;
        const handleConfig  = this.config.handle;
        
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

        (this.config.handle.show !== true) ? __wbn$(this.handle).hide() : __wbn$(this.handle).show();
        (this.config.ribbon.show !== true) ? this.progressElem.classList.add('hidden_ribbon') : this.progressElem.classList.remove('hidden_ribbon');
        
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
        }).on(['mousemove', 'touchmove'], (e) => {
            me._updateProgress(e)
        },{passive:false});
        
        __wbn$(document).on(['mouseup','touchend'], (e) => { if(me.progressDrag) { me.config.onDragEnd(me.slider); } me.progressDrag = false; });
        document.addEventListener('mousemove', (e) => me._updateProgress(e));

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

        window.onresize = () => { this._refreshUI(); }
        return this;
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
            
            const tickLabel = tickData[i]?.label ? (typeof tickData[i]?.label === 'function' ? tickData[i]?.label(tickValue) : tickData[i]?.label) : tickData[i]?.value || '';

            let tickPosition = tickData[i]?.position || ticks.position;
            let tickStyle = tickData[i].style || ticks.style;

            const containerRect = this.container.getBoundingClientRect();
            
            if (tickPosition == 'auto') {
                tickPosition = tickStyle == 'scale' ? ((containerRect.bottom + 30 > window.innerHeight) ? 'top' : 'bottom') : 'center';
            }
            
            const tickClass = `${tickStyle} ${tickPosition}`;

            var tickEle = __wbn$().create('div', true)
                .setStyle({ 'position': 'absolute' })
                .setClass(`${CSSNamespace}tick_${tickClass}`)
                .setAttr('wbn-value', tickValue)
                .html(tickLabel)
                .elem;

            me.container.parentNode?.insertBefore(tickEle, me.container.nextSibling);

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
        
        this.container.addEventListener('mousemove',(e: any) => {
            this._showTooltip(_tooltip,position,e.clientX);
        });
        
        if (tooltipConfig.ticks.show === true) {
            this.ticks.forEach((tick,i) => {
               tick.addEventListener('mousemove',(e: any) => {
                    this._showTooltip(_tooltip,position,e.clientX,true,i);
               });
            });
        }
 
        this.container.addEventListener('mouseout',(e) => {
            _tooltip.style.display = 'none'; 
        });
        
        this.tooltip = _tooltip;
        
        return this;
        
    }
   
    _showTooltip(_tooltip: HTMLElement,position: string,tooltipLeft: number,isTick?: boolean | false,tickIndex?: number | null) {
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
        var _tooltipStyle = '';
        
        var labelConfig = isTick ? tooltipConfig.ticks.label : tooltipConfig.label;
        
        if (labelConfig) {
            if (typeof labelConfig.text === 'function') {
                _tooltipText = labelConfig.text(wbnVal,tickIndex);
            } else {
                _tooltipText = labelConfig.text;
            }
            if (labelConfig.style) {
                 if (typeof labelConfig.style === 'function') {
                    _tooltipStyle = labelConfig.style(wbnVal,tickIndex);
                 } else {
                    _tooltipStyle = labelConfig.style;
                 }
                 
                _tooltip.setAttribute("style", _tooltipStyle);
                
            }
        }
        
        _tooltip.innerHTML = _tooltipText;
        _tooltip.style.display = 'block';
        const _tooltipLeft = (wbnVal - ui.min) * ui.progressWidth / (ui.max - ui.min) + this.progressElem.offsetLeft - (_tooltip.clientWidth / 2);
        const _tooltipTop = (position == 'bottom') ? this.container.clientHeight + _tooltip.clientHeight : this.container.offsetTop - _tooltip.clientHeight;
        
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
        const progressValue = this.progressElem.value;
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