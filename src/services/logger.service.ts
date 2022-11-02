export type ErrorCallback = (message: string, isError?: boolean) => void;

let callbackIndex = 0;
let errorCallbackMap: Map<number, ErrorCallback> = new Map();

let lastLoggedAt = Date.now();

const isDev = !!process.env.CX_DEV_USER_LIB;
if (isDev) console.warn("Running 'node-red-contrib-cx-user-lib' in CX development mode");

export default class Logger {
    private readonly tag: string;

    static isCallbackPrefixed = false;

    static registerLogCallback(callback: ErrorCallback): () => void {
        callbackIndex++;
        errorCallbackMap.set(callbackIndex, callback);
        return function() {
            errorCallbackMap.delete(callbackIndex);
        }
    }

    constructor(className: string) {
        this.tag = className;
    }

    public info(...args: any) {
        if (isDev) {
            const diff = Date.now() - lastLoggedAt;
            console.log(this.messagePrefix(), ...args, "["+diff+"ms]");
            lastLoggedAt = Date.now();
        }

        if (errorCallbackMap.size > 0) {
            // converting ALL args to string if not a string
            const message = (Logger.isCallbackPrefixed ?  this.messagePrefix() : "") +
                [...args].map(v => (typeof v === "string" ? v : JSON.stringify(v))).join(",");
            errorCallbackMap.forEach(callback => callback(message));
        }
    }

    public error(error: Error | string) {
        const errMessage = (error instanceof Error) ? error.message : error;

        const diff = Date.now() - lastLoggedAt;
        const message = "ERROR: " + errMessage +  " ["+diff+"ms]";
        if (isDev) {
            console.error(this.messagePrefix() + message);
            lastLoggedAt = Date.now();
        }

        if (errorCallbackMap.size > 0) {
            const cbMessage = (Logger.isCallbackPrefixed ?  this.messagePrefix() : "") + message;
            errorCallbackMap.forEach(callback => callback(cbMessage, true));
        }
    }

    private messagePrefix(): string {
        const date = new Date();
        return date.toLocaleString() + ' @ ' + this.tag + " > ";
    }
}

export const ERRORS = {};
