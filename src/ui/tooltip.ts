import { Options, CSSNamespace } from './../core/types';
import {WebenomicCore} from './../core/util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
import { _valOrFunc } from './../core/funcs';

export class Tooltip {
    
    ui: any;
    config: Options;
    tooltip: any;
    
    constructor(ui: any, config: Options) {
        this.ui = ui;
        this.config = config;
        return this._createTooltip();
    }
    
    _createTooltip() {
        if (this.config.tooltips.show === false) return this;
        
        const { container, progressDrag, vertical, tickLabels, config: { tooltips: tooltipConfig, ticks: { labels: { data: labelData }}}} = this.ui;
        const _tooltip = __wbn$().create('div',true)
                                 .setClass(`${CSSNamespace}tooltip`)
                                 .setStyle({display:'none'})
                                 .elem;

        container.appendChild(_tooltip);
        
        this.ui.tickOn = null;
        const posProperty = vertical ? 'clientY' : 'clientX';
        
        tickLabels.forEach((tickEle,i) => {
            __wbn$(tickEle).on('mouseover',(e: MouseEvent) => { 
                this.ui.tickOn = i;
                this.ui.tickVal = labelData ? labelData[i].value : null;
                //if (tooltipConfig.ticks.show) this._positionTooltip(_tooltip,e[posProperty] || e.touches[0][posProperty], this.tickOn, this.tickVal);
            }).on('mouseout',() => { 
                this.ui.tickVal = null;
                this.ui.tickOn = null; 
            });
        });
        
        [container,document].forEach((elem) => {
            __wbn$(elem).on(['touchmove','touchstart','mouseover','mousemove'],(e: any) => {
                if (this.ui.tickOn && !tooltipConfig.ticks.show) return;
                if (progressDrag || e.currentTarget == container) this._positionTooltip(_tooltip,e[posProperty] || e.touches[0][posProperty], this.ui.tickOn, this.ui.tickVal);
            }).on(['touchend','mouseup','mouseout'],() => {
                _tooltip.hide();
            });
        });

        this.ui.tooltip = _tooltip;
        return this;
    }

    _positionTooltip(_tooltip: HTMLElement,tooltipStart: number,tickIndex?: number | null,tickVal?: string | null) {
        
        const { progressElem, slider, steps, vertical, config: {tooltips: tooltipConfig } } = this.ui;
        const { positionOffsetProperty, progressTop, progressBottom, progressThickness, directionAlias, progressLeft, progressRight, progressLength } = this.ui._dimensions(true);
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
            wbnVal = this.ui._progValToWbnVal(_progValue[directionAlias].toFixed(2).toString()); 
            if (steps.length > 0) wbnVal = this.ui._wbnValToStep(wbnVal);
        }
             
        var labelConfig = tickIndex !== null ? tooltipConfig.ticks.label : tooltipConfig.label;
        var _tooltipText = _valOrFunc(labelConfig.text,[slider,wbnVal,tickIndex],wbnVal);
        
        const _tooltipStyle = {
            ..._valOrFunc(labelConfig.style,[slider,wbnVal,tickIndex],{}),
            ..._valOrFunc(tooltipConfig.style,[slider,wbnVal,tickIndex],{})
        };
        
        __wbn$(_tooltip).setStyle(_tooltipStyle);        
        _tooltip.innerHTML = _tooltipText;
        _tooltip.show();
        
        const tooltipPosition = _valOrFunc(tooltipConfig.position,[slider,wbnVal],0);
        const tooltipPoint = this.ui._tickPoint(_tooltip,wbnVal,tooltipPosition)[0];
        const tooltipTop = progressElem[positionOffsetProperty] + (vertical ? 0 : progressThickness/2) - (_tooltip.rect()[vertical ? 'width' : 'height']/2) + tooltipPosition;

        const _finalStyle = vertical ? {
            top: tooltipPoint,
            left: tooltipTop
        } : {
            left: tooltipPoint,
            top: tooltipTop
        }

        Object.assign(_tooltip.style,_finalStyle);
    }
    
}
    