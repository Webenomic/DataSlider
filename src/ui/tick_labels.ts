import { Options, CSSNamespace, TickLabel } from './../core/types';
import {WebenomicCore} from './../core/util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
import { _valOrFunc } from './../core/funcs';

export class TickLabels {
    
    ui: any;
    config: Options;
    
    constructor(ui: any, config: Options) {
        this.ui = ui;
        this.config = config;
        this._createTickLabels();
        return this; 
    }
    
    _createTickLabels() {
        
        return new Promise((res) => {
            const {slider,container,slider: { config: { range: { min, max }, ticks: { labels: tickLabels }}}} = this.ui;
            var {data: tickData} = tickLabels;
        
            if (tickData.length === 0) return this;
            
            const uniq = (val: any, i: number, self) => { return self.indexOf(val) === i };
            tickData.sort((a:any, b: any) => (a.value > b.value) ? 1 : -1).filter(uniq);
            tickData = tickData.filter((tick: any) => { 
                const inRange = (tick.value > min && tick.value < max);
                if (!inRange) console.error(`Tick label value ${tick.value} out of range. Ignored.`);
                return inRange; 
            });
            slider.config.ticks.labels.data = tickData;
            this.ui.tickLabels = [];
            
            const me = this;
            var ticksAndSteps: any[] = tickData.map((tick: any) => { return tick.value; }).sort();
            
            ticksAndSteps.forEach((tick, i) => {
                
                const tickValue = tickData[i].value !== undefined ? tickData[i].value : tick;
                const tickLabel = _valOrFunc(tickData[i]?.label?.text,[slider,tickData[i]?.value,i],tickData[i]?.value); 
                const tickClassName = tickLabels.className || tick.className || ''; 
                const tickStyles = {
                    style: {},
                    hoverStyle: {},
                    selectedStyle: {}
                };
                
                ['style','hoverStyle','selectedStyle'].forEach((styleVar) => {
                    tickStyles[styleVar] = {
                        ..._valOrFunc(tickData[i]?.label[styleVar],[slider,tickData[i]?.value,i],{}),
                        ..._valOrFunc(tickLabels[styleVar],[slider,tickData[i]?.value,i],{})
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
    
                container.appendChild(tickEle.elem);
                me._positionTickLabel(tickEle.elem, tickValue, tickData[i],i);
                me.ui.tickLabels.push(tickEle.elem);
                
                
            });
            res(this);
        });
    }    
    
    _positionTickLabel(tickEle: any, tickValue: number, tickData: TickLabel, tickIndex: number) {
        const {vertical, slider, progressElem, config: {range: { min,max }, ticks: { labels: tickLabels }}} = this.ui;
        const { positionProperty } = this.ui._dimensions();
        if (tickValue < min || tickValue > max) return;
        const me = this;
        let tickPosition = _valOrFunc(tickLabels.position,[slider,tickValue,tickIndex],0);
        const tickPoints = this.ui._tickPoint(tickEle,tickValue,tickPosition);
        tickEle.style[positionProperty] = tickPoints[0];
        tickEle.style[vertical ? 'left' : 'top'] = tickPoints[1];
        
        if (tickLabels.labelsClickable !== false) {
            __wbn$(tickEle).setAttr('tabindex','0');
            const [deselectedEvent,selectedEvent] = ['deselected','selected'].map((customEvent) => { return new CustomEvent(customEvent) });
            
            var _tickClick = (e: KeyboardEvent) => {
                if (e.which && e.which != 13) return;
                this.ui.tickLabels.forEach((elem) => elem.dispatchEvent(deselectedEvent));
                
                me._updateTicks(tickValue)
                  .then(() => this.ui._updateValue(this.ui._wbnValToProgVal(tickValue),tickValue))
                  .then(() => this.ui._updateBindings());
                
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
            const [deselectedEvent, selectedEvent] = ['deselected','selected'].map((customEvent) => { return new CustomEvent(customEvent) });
            this.ui.tickLabels.concat(this.ui.tickMarks).forEach((tick) => { (Number(tick.getAttribute('wbn-value')) === val) ? [tick.classList.add('wbn_selected'),tick.dispatchEvent(selectedEvent)] : [tick.classList.remove('wbn_selected'),tick.dispatchEvent(deselectedEvent)] });
            res(this);
        });
        
        return await ticksUpdated;
    }
    
}