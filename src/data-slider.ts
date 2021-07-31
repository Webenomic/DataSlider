import {WebenomicCore} from './util';
import {Config} from './config';
import {Container, Options, CSSNamespace} from './types';
import {SliderUI} from './ui';

const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

class Slider {
    
    container: Container;
    config: any;
    wbnBindScope: {};
    bindVarName: string;
    ui: SliderUI;
    
    constructor(container: Container,options: Options) {
        this.container = container;
        this.config = new Config(container, options);
        this.ui     = new SliderUI(container, options, this);
        this.bindVarName = this.config.dataBinding.bind;  
        this.wbnBindScope = {};
        this._createProxy();
    }
    
    _createProxy() {
        const me = this;
        window.wbnScope = new Proxy(me.wbnBindScope, {
            set(target,prop,val) {
                me._updateValue(me._wbnValToProgVal(val),val);
                me._updateBindings();
                return true;
            },
            get(target,prop) {
                me._updateBindings();
            }
        });

        window.wbnScope[this.bindVarName] = window[this.bindVarName] || null;
        
        const initialValue = this.config.defaultValue;
        this.ui.progressElem.value = this._wbnValToProgVal(initialValue).toString(); 
    }
    
    _wbnValToProgVal(wbnVal) {
        const min = this.config.range.min;
        const max = this.config.range.max;
        return (wbnVal - min) * 100/(max-min); 
    }
    
    _updateValue(val,wbnVal) {
        const min = this.config.range.min;
        const max = this.config.range.max;
        if (wbnVal < min || wbnVal > max) return;
        const decimals = this.config.range.decimals;
        __wbn$(this.ui.progressElem)
            .setVal(val)
            .setAttr('wbn-value',Number(wbnVal).toFixed(decimals));
        
        if (window.wbnScope[this.bindVarName] != wbnVal) {
            this.wbnBindScope[this.bindVarName] = wbnVal;
        }
    }
    
    _updateBindings() {
        const min = this.config.range.min;
        const max = this.config.range.max;
        const varName = this.bindVarName;
        var val = this.wbnBindScope[varName];
        if (val === undefined || val < min || val > max) return;
        var transform = this.config.dataBinding.transform;
        var newVal = (transform) ? transform(val) : val;
        document.querySelectorAll('[wbn-bind='+varName+']').forEach((ele: any) => {
            var transform = (window as any)[ele.getAttribute('wbn-bind-transform')];
            var finalVal = (transform) ? transform(val) : newVal;
            ele.tagName == 'INPUT' ? ele.value = finalVal : ele.innerHTML = finalVal;
        });
        this.ui._updateTicks(val);
        this.ui._updateHandle(this._wbnValToProgVal(val));
    }
  
}

//vanilla js script include
declare global { interface Window { DataSlider: any; wbnScope: any; } }
window.DataSlider = Slider || {};
window.wbnScope = {};

//ES Module export
const DataSlider = function(container: Element, options?: any) { return new Slider(container, options); }
export {DataSlider};