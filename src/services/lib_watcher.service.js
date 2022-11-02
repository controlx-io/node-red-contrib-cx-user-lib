"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs = __importStar(require("fs"));
const logger_service_1 = __importDefault(require("./logger.service"));
const path = __importStar(require("path"));
const logger = new logger_service_1.default("LibWatcherService");
const lib = {};
const libAlias = 'uLib';
const combinedDeclarationFileName = 'node-red-contrib-cx-user-lib.d.ts';
const typesPath = (process.env.NODE_RED_HOME) ?
    path.resolve(process.env.NODE_RED_HOME + '/../@node-red/editor-client/public/types') : '';
const otherTypesPath = typesPath ? typesPath + '/other' : '';
let isTypesFolderPresent = false;
if (typesPath && fs.existsSync(typesPath)) {
    if (!fs.existsSync(otherTypesPath))
        fs.mkdirSync(otherTypesPath);
    isTypesFolderPresent = true;
}
const userLibsPath = process.cwd() + '/user_lib';
if (!fs.existsSync(userLibsPath))
    fs.mkdirSync(userLibsPath);
fs.watch(userLibsPath, (_, filename) => {
    if (filename.endsWith('.js')) {
        addLib(filename);
        createDeclarations(libAlias).catch(logger.error);
    }
});
fs.readdir(userLibsPath, async (_, files) => {
    files.forEach(filename => {
        if (filename.endsWith('.js'))
            addLib(filename);
    });
    createDeclarations(libAlias).catch();
});
async function createDeclarations(libAliasName) {
    if (!isTypesFolderPresent)
        return;
    let declarations = `declare const ${libAliasName}:{`;
    let combinedDeclarations = '';
    const moduleNames = Object.keys(lib);
    for (const moduleName of moduleNames) {
        const modulePath = userLibsPath + '/' + moduleName + '.d.ts';
        let text = await readFile(modulePath);
        if (!text)
            continue;
        text = text.replace(/export /g, '');
        text = text.replace('{};', '');
        text = text.replace('nodeRedExport', moduleName);
        combinedDeclarations += text;
        declarations += `${moduleName}: typeof ${moduleName},`;
    }
    declarations += '}\n';
    declarations += combinedDeclarations;
    fs.writeFile(otherTypesPath + '/' + combinedDeclarationFileName, declarations, (err) => {
        if (err)
            logger.error(err);
    });
}
function addLib(filename) {
    const moduleName = filename.slice(0, -3);
    const modulePath = userLibsPath + '/' + moduleName;
    const isModulePresent = !!lib[moduleName];
    const module = require.cache[require.resolve(modulePath)];
    if (module && module.exports && module.exports.destroy)
        module.exports.destroy();
    delete require.cache[require.resolve(modulePath)];
    delete lib[moduleName];
    try {
        const theExport = require(modulePath).nodeRedExport;
        if (!theExport) {
            return logger.info(`Module ${filename} is not exportable. nodeRedExport is missing in the module.`);
        }
        lib[moduleName] = theExport;
        logger.info(`Module ${filename} was ${isModulePresent ? 'modified' : 'added to the library'}.`);
    }
    catch (e) {
        logger.error('ERROR parsing module: ' + e.message);
    }
}
async function readFile(filePath) {
    return new Promise((accept) => {
        fs.readFile(filePath, (err, data) => {
            if (err)
                return accept('');
            accept(data.toString());
        });
    });
}
module.exports = lib;
//# sourceMappingURL=lib_watcher.service.js.map