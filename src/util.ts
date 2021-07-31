export class WebenomicCore {

    elems: any;
    elem: any;

    constructor(elems: any) {
        var _elems = elems;
        if (!Array.isArray(_elems)) {
            _elems = [_elems];
        }
        _elems.forEach((_elem,i: number) => {
            if (typeof _elem === 'string') {
                var selector = _elem.substr(0, 1);
                _elem = _elem.substr(1);
                _elem = selector == '.' ? (document.getElementsByClassName(_elem).length == 1 ? document.getElementsByClassName(_elem).item(0) : Array.from(document.getElementsByClassName(_elem))) : document.getElementById(_elem);
            }  
            if (Array.isArray(_elem)) {
                _elems.splice(i,1,_elem);      
            } else {
                _elems[i] = _elem;
            }
        });
        this.elems = _elems;
        this.elem = _elems[0];
        return this;
    }

    _apply(func) {
        this.elems.forEach((elem) => func(elem));
    }
    
    setVal(value: any) {
        this._apply((elem) => { elem.value = value; });
        return this;
    }
    
    getVal() {
        return this.elems[0].value;
    }

    hide() {
        this._apply((elem) => { elem.style.display = 'none' });
        return this;
    }

    show() {
        this._apply((elem) => { elem.style.display = 'block' });
        return this;
    }

    toggleBlock() {
        this._apply((elem) => { elem.style.display = (this.elem.style.display == 'none' ? 'block' : 'none') });
        return this;
    }

    html(html: string) {
        this._apply((elem) => { elem.innerHTML = html; });
        return this;
    }

    setClass(className: string) {
        this._apply((elem) => { elem.className = className; });
        return this;
    }

    create(domType: string, chain?: boolean) {
        this.elems[0] = document.createElement(domType);
        this.elem = this.elems[0];
        return chain ? this : this.elems[0];
    }

    set style(styles: object) {
        this._apply((elem) => { 
            var elemStyles = elem.style;
            Object.assign(elemStyles, styles);
        });
    }

    get style() {
        return this.elems[0].style;
    }

    getStyle(styleName: string): string {
        return this.style[styleName];
    }
    
    setStyle(styles: object) {
        this._apply((elem) => { 
            var elemStyles = elem.style;
            Object.assign(elemStyles, styles);
        });
        return this;
    }
    
    isMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    get attr() {
        return this.elems[0].attributes;
    }

    setAttr(attribute: string, value: string) {
        this._apply((elem) => { 
            elem.setAttribute(attribute, value);
        });
        return this;
    }

    prop(props: object) {
        this._apply((elem) => { 
            Object.assign(elem, props);
        });
        return this;
    }

    on(_event: any, func?: object, options?: object | boolean) {
        this._apply((elem) => { 
            if (typeof _event === 'string') _event = [_event];
            _event.forEach((_event: string) => {
                elem.addEventListener(_event, func, options);
            });
        });
        return this;
    }
    
    disable(condition: boolean) {
        this._apply((elem) => { 
            elem.style.opacity = condition ? 0.35 : 1;
            condition ? elem.setAttribute('disabled',condition) : elem.removeAttribute('disabled');
        });
        return this;
    }
    
    cookieSet(string: string) {
        document.cookie = string;
    }

    cookieGet(key: string) {
        var _cookieFound = document.cookie
            .split('; ')
            .find(row => row.startsWith(key + '='))
        return _cookieFound ? _cookieFound.split('=')[1] : null;
    }

}