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
        
        let startUp = () => {
            const startUpPromise = new Promise((res) => {
                this.wbnBindScope   = {},
                this.config         = new Config(parent, options),
                this.ui             = new SliderUI(parent, options, this);
                res(this);
            });
            return startUpPromise;
        };
        
        startUp().then(() => {
            const { config: {dataBinding: { property: bindVarName, scope: bindVarScope }}, ui } = this;
            ui.uiCreated.then(() => {
                this._createProxy().config.onReady(this);
            });
            
            Object.assign(this,{
                parent: parent,
                bindVarName: bindVarName,
                bindVarScope: bindVarScope,
            });
        });
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
        const { bindVarName, bindVarScope, config: { defaultValue, dataBinding: { scope }} } = this;
        scope.wbnScope = new Proxy(me.wbnBindScope, {
            set(target,prop,val) {
                me._updateValue(me._wbnValToProgVal(val),val)
                    .then(() => { me._updateBindings(); });
                return true;
            },
            get(target,prop) {
                me._updateBindings();
            }
        });

        scope.wbnScope[bindVarName] = bindVarScope[bindVarName] || null;
        
        this._wbnValToProgVal(defaultValue);
        this.update(defaultValue);
        return this;
    }
    
    loading(isLoading) {
        const progClassList = this.ui.progressElem.classList;
        const progClass = `${CSSNamespace}loading`;
        isLoading ? progClassList.add(progClass) : progClassList.remove(progClass);
    }
    
    update(val) {
        return this._updateValue(this._wbnValToProgVal(val),val)
            .then(() => { this._updateBindings(); });
    }
    
    _wbnValToProgVal(wbnVal) {
        const {range: { min,max }} = this.config;
        return (wbnVal - min) * 100/(max-min); 
    }
    
    _updateValue(val,wbnVal) {
        
        return new Promise((res,rej) => {
            if (!isFinite(val)) val = Number(val);
            const {min,max,decimals} = this.config.range;
            if (wbnVal < min || wbnVal > max) return;
            __wbn$(this.ui.progressElem)
                .setVal(Math.round(val))
                .setAttr('wbn-value',Number(wbnVal).toFixed(decimals));
                this.wbnBindScope[this.bindVarName] = wbnVal;
   
            this.value = wbnVal;
            res(this);
        });
    }
    
    _updateBindings() {
        const { config:{ range:{ min,max}, dataBinding: { transform }}, bindVarName, bindVarScope } = this;
        
        var val = this.wbnBindScope[bindVarName];
        if (val === undefined || val < min || val > max) return;
        var newVal = (transform) ? transform(val) : val;
        document.querySelectorAll(`[wbn-bind=${bindVarName}]`).forEach((ele: any) => {
            var transform = (window as any)[ele.getAttribute('wbn-bind-transform')];
            var finalVal = (transform) ? transform(val) : newVal;
            ele.tagName == 'INPUT' ? ele.value = finalVal : ele.innerHTML = finalVal;
        });
        
        const ui = this.ui; 
        if (ui.uiReady) {
            ui._updateTicks(val).then(() => {
                ui._updateHandle(this._wbnValToProgVal(val));
            }).then(() => {
                ui._assignAttributes();
            }).then(() => {
                this.config.onUpdate(this,val);
            });
        }
        
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