// TODO: Write a general knowledge for the code base such as using these helpers
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);
export const $id = (id) => document.getElementById(id);

// Event handling helpers
export const on = (element, event, handler, options = {}) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.addEventListener(event, handler, options);
    }
};

export const off = (element, event, handler) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.removeEventListener(event, handler);
    }
};

// Class manipulation helpers
export const addClass = (element, className) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.classList.add(className);
};

export const removeClass = (element, className) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.classList.remove(className);
};

export const toggleClass = (element, className, force) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    return element?.classList.toggle(className, force);
};

export const hasClass = (element, className) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    return element?.classList.contains(className) || false;
};

// Attribute helpers
export const setAttr = (element, name, value) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.setAttribute(name, value);
};

export const getAttr = (element, name) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    return element?.getAttribute(name);
};

export const removeAttr = (element, name) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.removeAttribute(name);
};

// Content helpers
export const setText = (element, text) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.textContent = text;
    }
};

export const getText = (element) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    return element?.textContent || '';
};

export const setHTML = (element, html) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.innerHTML = html;
    }
};

export const getHTML = (element) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    return element?.innerHTML || '';
};

// Style helpers
export const setStyle = (element, property, value) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.style[property] = value;
    }
};

export const getStyle = (element, property) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    return element ? getComputedStyle(element)[property] : null;
};

// Element creation helper
export const createElement = (tag, options = {}) => {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.id) {
        element.id = options.id;
    }
    
    if (options.textContent) {
        element.textContent = options.textContent;
    }
    
    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([name, value]) => {
            element.setAttribute(name, value);
        });
    }
    
    if (options.style) {
        Object.assign(element.style, options.style);
    }
    
    return element;
};

// Clipboard helper
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

// Scroll helpers
export const scrollToBottom = (element) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
};

// Focus helper
export const focusElement = (element, options = {}) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.focus(options);
};