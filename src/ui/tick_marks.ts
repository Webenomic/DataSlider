import { Options, CSSNamespace } from './../core/types';
import {WebenomicCore} from './../core/util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
import { _valOrFunc,_round } from './../core/funcs';

export class TickMarks {
    
    ui: any;
    config: Options;
    
    constructor(ui: any, config: Options) {
        this.ui = ui;
        this.config = config;
        this._createTickMarks();
        return this;
    }    
    
    _createTickMarks() {
        return new Promise((res) => {
            
            const { container, slider, config: { range: { min, max, decimals }, ticks: { marks: tickMarkConfig }}} = this.ui;
            this.ui.markSteps = [];
            this.ui.tickMarks = [];
            var tickIndex = 0;
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
                    markSteps.push(_round(newStep, decimals));
                    increment += 1;
                }

                markSteps.forEach((markValue) => {
                    
                    if (markValue < min || markValue > max) return;
                    var markEle = __wbn$().create('div',true)
                        .setClass(`${CSSNamespace}tick_mark`)
                        .setAttr('wbn-value', markValue)
                        .setStyle({
                            height: `${markSet.height}px`,
                            width: `${markSet.width}px`,
                            borderRadius: `${markSet.borderRadius}px`,
                            backgroundColor: markSet.color
                         })
                        .elem;   
                    
                    const markStyle = _valOrFunc(markSet?.style,[slider, markValue],{});
                    const markHoverStyle = _valOrFunc(markSet?.hoverStyle,[slider, markValue],markStyle);
                    const markSelectedStyle = _valOrFunc(markSet?.selectedStyle,[slider, markValue],markStyle);
                    
                    Object.assign(markEle.style,markStyle); 
                    Object.assign(markEle,{ position: markSet.position, markSet: markSet, markValue: markValue });
                    const thisMarkEle = __wbn$(markEle);
                    
                   thisMarkEle.on('mouseover',() => {
                        thisMarkEle.setStyle(markHoverStyle);  
                        this._positionTickMark(markEle,markValue,true);
                    }).on('mouseout',() => {
                        thisMarkEle.setStyle(slider.value == markValue ? markSelectedStyle : markStyle);
                        this._positionTickMark(markEle,markValue,true);  
                    }).on('selected',() => {
                        thisMarkEle.setStyle(markSelectedStyle);
                        this._positionTickMark(markEle,markValue,true);
                        //this.ui._updateHandle(markValue);
                    }).on('deselected',() => {
                         thisMarkEle.setStyle(markStyle);
                         this._positionTickMark(markEle,markValue,true);
                    });
                    
                   
                    container.appendChild(markEle);
                    this.ui.tickMarks.push(markEle);
                });
                
                this.ui.markSteps = this.ui.markSteps.concat(markSteps);
            });
            
            Object.assign(this.ui,{
                markSteps: this.ui.markSteps,
                tickMarks: this.ui.tickMarks,
            });
            
            res(this);
        });
    }
    
    _positionTickMark(markEle: any, markValue: number, skipEvents?: boolean | false) {
            const { vertical, slider } = this.ui;
            const { positionProperty } = this.ui._dimensions();
            
            const markPosition = _valOrFunc(markEle.markSet.position,[slider, markValue],0);
            const markPoints = this.ui._tickPoint(markEle, markValue, markPosition);
            
            //re-register default style if tickMark is in selected state
            if (!skipEvents) {
                const [deselectedEvent, selectedEvent] = ['deselected', 'selected'].map((customEvent) => { return new CustomEvent(customEvent); });
                if (markValue == slider.value) {
                    markEle.dispatchEvent(deselectedEvent);
                    markEle.dispatchEvent(selectedEvent);
                }
            }
            
            
            
            markEle.style[vertical ? 'left' : 'top'] = `${markPoints[1]}px`;
            markEle.style[positionProperty] = `${markPoints[0]}px`;
            
            //re-register selected state, if present
            
            return this;
    }
    
    _updateTickMarks() {
        const { slider} = this.ui;
        this.ui.tickMarks.forEach((markEle,i) => {
            const markSet = markEle.markSet;
            if (typeof markSet.style === 'function') {
                const markStyle = _valOrFunc(markSet?.style,[slider,Number(markEle.markValue) ],{});
                Object.assign(markEle.style,markStyle); 
                this._positionTickMark(markEle,markEle.markValue,true);
            }
        });
    }
}