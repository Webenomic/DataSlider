import { Options, Container, CSSNamespace } from './types';
import { WebenomicCore } from './util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

export class SliderUI {

    progressElem: HTMLInputElement;
    container: Element;
    handle: Element;
    config: Options;
    slider: any;
    steps: number[];
    ticks: Element[];
    progressDrag: boolean;

    constructor(container: Container, config: Options, slider: any) {
        this.slider = slider;
        this.config = config;
        this.container = container;
        this._createElements();
        this._createSteps();
        this._createTicks();
        this._responsiveUI();
        this.UI();
        return this;
    }

    UI() {
        const config = this.config;

        const height = config.height;
        const progressDrag = this.progressDrag;
        const progressRect = this.progressElem.getBoundingClientRect();
        const progressLeft = Math.round(progressRect.left);
        const progressWidth = progressRect.width;
        const progressRight = progressLeft + progressWidth;
        const min = config.range.min;
        const max = config.range.max;
        const step = config.range.step;
        const decimals = config.range.decimals;
        const defaultValue = config.defaultValue;

        return {
            height: height,
            progressDrag: progressDrag,
            progressRect: progressRect,
            progressLeft: progressLeft,
            progressWidth: progressWidth,
            progressRight: progressRight,
            min: min,
            max: max,
            step: step,
            decimals: decimals,
            defaultValue: defaultValue
        }
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

        this._assignAttributes();
        this._assignEvents();
    }

    update() {
        this._assignAttributes();
        this._refreshUI()
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
        
        const handleHeight          = handleDimension('height');
        const handleWidth           = handleDimension('width');
        const handleBorderRadius    = handleDimension('borderRadius');
        
        __wbn$(this.handle)
            .setStyle({
                'height': handleHeight,
                'width': handleWidth,
                'borderRadius': `${handleBorderRadius}px`,
                'top': ui.progressRect.top - (handleHeight / 2) + (elemHeight / 2)
            });

        (this.config.handle.show !== true) ? __wbn$(this.handle).hide() : __wbn$(this.handle).show();
        (this.config.ribbon.show !== true) ? this.progressElem.classList.add('hidden_ribbon') : this.progressElem.classList.remove('hidden_ribbon')

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
    }

    _assignEvents() {
        const me = this;
        const ui = this.UI();
        __wbn$(this.container).on('mousedown', (e) => {
            me.progressDrag = true;
            me._updateProgress(e);
        }).on(['mousemove', 'touchmove'], (e) => me._updateProgress(e));

        document.addEventListener('mouseup', () => { me.progressDrag = false; });
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
    }

    _createTicks() {
        const ticks = this.slider.config.ticks;
        var tickData = ticks.data;
        this.ticks = [];
        if (tickData.length === 0) return;

        const me = this;
        const uniq = (val, i, self) => { return self.indexOf(val) === i };

        var ticksAndSteps: any[] = tickData.map((tick, i) => { return tick.value }).sort();

        const ui = this.UI();
        ticksAndSteps.forEach((tick, i) => {
            const tickValue = tickData[i]?.value || tick;
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

            let tickX = me._positionTick(tickEle, tickValue, tickData[i]);
            me.ticks.push(tickEle);
        });
    }

    _positionTick(tickEle, tickValue, tickData) {
        const ui = this.UI();
        const me = this;
        var tickX = (tickValue - ui.min) * ui.progressWidth / (ui.max - ui.min) + ui.progressLeft;
        var tickLeft = tickX - (tickEle.getBoundingClientRect().width / 2);
        tickEle.style.left = tickLeft;
        
        const handleRect = this.handle.getBoundingClientRect();
        const tickHeight = tickEle.getBoundingClientRect().height;
        
        let tickPosition = tickData?.position || this.config.ticks.position;
        let tickStyle = tickData?.style || this.config.ticks.style;
        const containerRect = this.container.getBoundingClientRect();
        
        if (tickPosition == 'auto') {
            tickPosition = tickStyle == 'scale' ? ((containerRect.bottom + 30 > window.innerHeight) ? 'top' : 'bottom') : 'center';
        }
        
        const tickTop = tickPosition == 'center' ? ui.progressRect.top - (tickHeight / 2) + (this.config.height / 2) : (tickPosition == 'bottom' ? handleRect.bottom + 1 : handleRect.top - tickHeight - 1);  
        
        tickEle.style.top = tickTop;

        if (this.config.ticks.labelsClickable !== false) {
            var _tickClick = () => {
                me._updateTicks(tickValue);
                me._updateProgress(null, tickX);
                me._updateBindings();
                tickEle.classList.add('wbn_selected');
            }
            if (tickEle._eventHandler) tickEle.removeEventListener('click', tickEle._eventHandler);
            tickEle.classList.add('clickable');
            tickEle.addEventListener('mousedown',(e) => {this.progressDrag = true;});
            tickEle.addEventListener('click', _tickClick);
            tickEle._eventHandler = _tickClick;
        }

        return tickX;
    }

    _updateTicks(val) {
        this.ticks.forEach((tick) => { (tick.getAttribute('wbn-value') == val) ? tick.classList.add('wbn_selected') : tick.classList.remove('wbn_selected'); });
    }

    _updateHandle(val) {
        const ui = this.UI();
        const handleWidth = this.handle.getBoundingClientRect().width;
        __wbn$(this.handle)
            .setStyle({ 'left': ui.progressLeft - handleWidth / 2 + this._clamp(val / 100, 0, 1) * ui.progressWidth });
    }

    _refreshUI() {
        const tickData = this.slider.config.ticks.data;
        const progressValue = this.progressElem.value;
        this.ticks.forEach((tick, i) => {
            this._positionTick(tick, tickData[i] ? tickData[i].value : tick, tickData[i]);
        });
        this._responsiveUI();
        this._updateHandle(progressValue);
    }

    _responsiveUI() {
        const ui = this.UI();
        let lastRect;
        this.ticks.forEach((tick, i) => {
            var tickRect = tick.getBoundingClientRect();
            __wbn$(tick).setStyle({ visibility: (lastRect && tickRect.left <= lastRect.right) ? 'hidden' : 'visible' });
            if (__wbn$(tick).getStyle('visibility') != 'hidden') lastRect = tickRect;
        });

    }

    _wbnValToProgVal(wbnVal) {
        return this.slider._wbnValToProgVal(wbnVal);
    }

    _updateValue(val, wbnVal) {
        return this.slider._updateValue(val, wbnVal);
    }

    _updateBindings() {
        return this.slider._updateBindings();
    }

    _updateProgress(e: any, tickX?: number) {
        const ui = this.UI();
        const progressElem = this.progressElem

        if (!this.progressDrag && !tickX && e.touches === undefined) return
        const clientX = e ? e.clientX || e.touches[0].clientX : tickX;

        const progressValue = Math.round((clientX - ui.progressLeft) / ui.progressWidth * 100);
        var wbnValue = this._round(this._clamp(ui.min + ((ui.max - ui.min) * progressValue / 100), ui.min, ui.max), ui.decimals);
        var newValue;

        const steps = this.steps;
        if (steps.length) {
            var nearestSteps = [];
            var diff = Math.abs(Number(steps[0]) - wbnValue);
            var stepIndex = 0;
            steps.forEach((step, i) => {

                var thisDiff = Math.abs(step - wbnValue);
                if (thisDiff < diff) {
                    diff = thisDiff;
                    stepIndex = i;
                }
            });
            wbnValue = steps[stepIndex];
            newValue = this._wbnValToProgVal(wbnValue);
        } else {
            newValue = progressValue;
        }

        //if (Math.abs(newValue - Number(progressElem.value)) < 10) {
        this._updateValue(newValue, wbnValue);
        this._updateHandle(newValue);
        this._updateBindings();
        return;
        //}


        /*
        var increment = newValue > progressElem.value ? 1 : -1;
        var easing = 0;
        const animation = setInterval(() => { 
            easing += 0.5;
            var easedIncrement = increment > 0 ? increment + (easing/20) : increment - (easing/20);
            if (increment > 0 ? progressElem.value < newValue : progressElem.value > newValue) {
                progressElem.value += easedIncrement;
                this._updateHandle(progressElem.value); 
            } else {
                this._updateValue(newValue,wbnValue);
                this._updateBindings();
                clearInterval(animation);
            }
    
        },5);
        */

    }

}