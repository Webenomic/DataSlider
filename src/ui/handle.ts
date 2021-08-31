import { Options, CSSNamespace } from './../core/types';
import {WebenomicCore} from './../core/util';
const __wbn$ = function(args?: any) { return new WebenomicCore(args); }
import { _valOrFunc } from './../core/funcs';

export class Handle {
    
    ui: any;
    config: Options;
    
    constructor(ui: any, config: Options) {
        this.ui = ui;
        this.config = config;
        this._positionHandle()._updateHandle(ui.slider.value).then(() => {
            this._handleLabel();
        });
        return this;
    }    
    
    _positionHandle() {
        const { slider, vertical, handle, progressElem, config: { handle: handleConfig, bar: {thickness: elemHeight }}} = this.ui;
        
        const handleDimension = (dimension: string) => {
            var thisDimension = _valOrFunc(handleConfig[dimension],[slider,slider.value],null);
            return (thisDimension === null ? elemHeight * 2 : thisDimension);
        }
        
        const handlePos = progressElem[vertical ? 'offsetLeft' : 'offsetTop'] - 
                            (handle.rect()[vertical ? 'width' : 'height'] / 2) + 
                            (vertical ? 0 : elemHeight / 2) + 
                            _valOrFunc(handleConfig.position,[slider,slider.value],0);

        var handleCoreStyle = {
            'height': handleDimension('height'),
            'width': handleDimension('width'),
            'borderRadius': `${handleDimension('borderRadius')}px`,
        }
        
        const handleAdditionalStyle = _valOrFunc(handleConfig.style,[slider,slider.value],{});
        
        Object.assign(handleCoreStyle,handleAdditionalStyle);
        Object.assign(handleCoreStyle,vertical ? { 'left':handlePos } : {'top':handlePos});
        
        __wbn$(handle)
            .setStyle(handleCoreStyle);
        
        return this;
    }
    
    _updateHandle(val: number) {
        return new Promise((res) => {
            const {handle, vertical, config, slider} = this.ui;
            this._positionHandle();
            const handlePoint = this.ui._centerPoint(handle,val,_valOrFunc(config.handle.position,[slider,slider.value],0))[0]
            __wbn$(handle).setStyle(vertical ? { 'top' : handlePoint } : { 'left' : handlePoint });
            this._handleLabel();
            res(this);
        });
    }
    
    _handleLabel() {
        const { slider, vertical, handle, handleLabel,  config: { handle: { label: labelConfig }}} = this.ui;
        if (!labelConfig) return;
        
        const labelValue = slider.value !== undefined ? slider.value : slider.defaultValue;
        var labelHtml = _valOrFunc(labelConfig.text,[slider,labelValue],labelValue);
        __wbn$(handleLabel).html(labelHtml);
        handleLabel.show();
        
        const handleRect = handle.rect();
        const labelRect = handleLabel.rect();
        const labelPosition = _valOrFunc(labelConfig.position,[slider,slider.value],0);
        
        __wbn$(handleLabel)
            .setStyle({
              'left':handleRect.width/2 - labelRect.width/2 + (vertical ? labelPosition : 0),
              'top':handleRect.height/2 - labelRect.height/2 + (vertical ? 0 : labelPosition)
            });   
        
         var handleLabelStyle = _valOrFunc(labelConfig.style,[slider,slider.value],{});
         Object.assign(handleLabel.style,handleLabelStyle);  
         return this;
    }
    
}