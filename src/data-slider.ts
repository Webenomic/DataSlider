import {WebenomicCore} from './util';
import {Config} from './config';
import {Options, CSSNamespace} from './types';
import {SliderUI} from './ui';

const __wbn$ = function(args?: any) { return new WebenomicCore(args); }

class Slider {
    
    parent: any;
    config: any;
    wbnBindScope: {};
    bindVarName: string;
    bindVarScope: any;
    ui: SliderUI;
    value: number;
    
    constructor(parent: any,options: Options) {
        this.parent = parent;
        this.config = new Config(parent, options);
        this.ui     = new SliderUI(parent, options, this);
        this.bindVarName = this.config.dataBinding.property;
        this.bindVarScope = this.config.dataBinding.scope;
        //this.parent.slider = this;  
        this.wbnBindScope = {};
        this._createProxy();
    }
    
    reset(val?: number) {
        this.ui._destroy();
        this.ui = new SliderUI(this.parent, this.config, this);
        if (val) {
            this._updateValue(this._wbnValToProgVal(val),val);
            this._updateBindings();
        }
        return this;
    }
    
    _createProxy() {
        const me = this;
        const scope = this.config.dataBinding.scope;
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

        window.wbnScope[this.bindVarName] = this.bindVarScope[this.bindVarName] || null;
        
        const initialValue = this.config.defaultValue;
        const initialProgValue = this._wbnValToProgVal(initialValue);
        this.ui.progressElem.value = initialProgValue.toString();
        this.ui._updateHandle(initialProgValue); 
        this.ui._updateTicks(initialValue);
    }
    
    loading(isLoading) {
        const progClassList = this.ui.progressElem.classList;
        const progClass = `${CSSNamespace}loading`;
        isLoading ? progClassList.add(progClass) : progClassList.remove(progClass);
    }
    
    update(val) {
        this._updateValue(this._wbnValToProgVal(val),val);
        this._updateBindings();
        return this;
    }
    
    _wbnValToProgVal(wbnVal) {
        const min = this.config.range.min;
        const max = this.config.range.max;
        return (wbnVal - min) * 100/(max-min); 
    }
    
    _updateValue(val,wbnVal) {
        if (!isFinite(val)) return;
        const min = this.config.range.min;
        const max = this.config.range.max;
        if (wbnVal < min || wbnVal > max) return;
        const decimals = this.config.range.decimals;
        __wbn$(this.ui.progressElem)
            .setVal(Math.round(val))
            .setAttr('wbn-value',Number(wbnVal).toFixed(decimals));
        
        //if (this.bindVarScope.wbnScope[this.bindVarName] != wbnVal) {
            this.wbnBindScope[this.bindVarName] = wbnVal;
        //}
        
        this.value = wbnVal;
        return this;
    }
    
    _updateBindings(skipEvent?: boolean | false) {
        const min = this.config.range.min;
        const max = this.config.range.max;
        const varName = this.bindVarName;
        const varScope = this.bindVarScope;
        var val = this.wbnBindScope[varName];
        if (val === undefined || val < min || val > max) return;
        var transform = this.config.dataBinding.transform;
        var newVal = (transform) ? transform(val) : val;
        document.querySelectorAll(`[wbn-bind=${varName}]`).forEach((ele: any) => {
            var transform = (window as any)[ele.getAttribute('wbn-bind-transform')];
            var finalVal = (transform) ? transform(val) : newVal;
            ele.tagName == 'INPUT' ? ele.value = finalVal : ele.innerHTML = finalVal;
        });
        this.ui._updateTicks(val);
        this.ui._updateHandle(this._wbnValToProgVal(val));
        this.ui._assignAttributes();
        this.config.onUpdate(this);
        return this;
    }
  
}

//vanilla js script include
declare global { interface Window { DataSlider: any; wbnScope: any; DataSliders: [] } }
window.DataSlider = Slider || {};
window.wbnScope = {};

//ES Module export
const DataSlider = function(parent: Element, options?: any) { return new Slider(parent, options); }
export {DataSlider};