"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERRORS = void 0;
let callbackIndex = 0;
let errorCallbackMap = new Map();
let lastLoggedAt = Date.now();
const isDev = !!process.env.CX_DEV;
if (isDev)
    console.warn("Running in CX development mode");
class Logger {
    constructor(className) {
        this.tag = className;
    }
    static registerLogCallback(callback) {
        callbackIndex++;
        errorCallbackMap.set(callbackIndex, callback);
        return function () {
            errorCallbackMap.delete(callbackIndex);
        };
    }
    info(...args) {
        if (isDev) {
            const diff = Date.now() - lastLoggedAt;
            console.log(this.messagePrefix(), ...args, "[" + diff + "ms]");
            lastLoggedAt = Date.now();
        }
        if (errorCallbackMap.size > 0) {
            const message = (Logger.isCallbackPrefixed ? this.messagePrefix() : "") +
                [...args].map(v => (typeof v === "string" ? v : JSON.stringify(v))).join(",");
            errorCallbackMap.forEach(callback => callback(message));
        }
    }
    error(error) {
        const errMessage = (error instanceof Error) ? error.message : error;
        const diff = Date.now() - lastLoggedAt;
        const message = "ERROR: " + errMessage + " [" + diff + "ms]";
        if (isDev) {
            console.error(this.messagePrefix() + message);
            lastLoggedAt = Date.now();
        }
        if (errorCallbackMap.size > 0) {
            const cbMessage = (Logger.isCallbackPrefixed ? this.messagePrefix() : "") + message;
            errorCallbackMap.forEach(callback => callback(cbMessage, true));
        }
    }
    messagePrefix() {
        const date = new Date();
        return date.toLocaleString() + ' @ ' + this.tag + " > ";
    }
}
exports.default = Logger;
Logger.isCallbackPrefixed = false;
exports.ERRORS = {};
//# sourceMappingURL=logger.service.js.map