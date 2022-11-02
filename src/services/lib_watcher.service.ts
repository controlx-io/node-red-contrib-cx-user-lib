import * as fs from "fs";
import Logger from "./logger.service";
import * as path from "path";

const logger = new Logger("LibWatcherService");
const lib: {[key:string]: any} = {};
const libAlias = 'uLib';
const combinedDeclarationFileName = 'node-red-contrib-cx-user-lib.d.ts';

let typesPath = (process.env.NODE_RED_HOME) ?
    path.resolve(process.env.NODE_RED_HOME + '/node_modules/@node-red/editor-client/public/types') : '';

if (typesPath && !fs.existsSync(typesPath))
    typesPath =
        path.resolve(process.env.NODE_RED_HOME + '/../@node-red/editor-client/public/types');


const otherTypesPath = typesPath ? typesPath + '/other' : '';

let isTypesFolderPresent = false;

if (typesPath && fs.existsSync(typesPath)) {
    if (!fs.existsSync(otherTypesPath)) fs.mkdirSync(otherTypesPath);
    isTypesFolderPresent = true;
}

const userLibsPath = process.cwd() + '/user_lib';
if (!fs.existsSync(userLibsPath)) fs.mkdirSync(userLibsPath);


fs.watch(userLibsPath, (_, filename) => {
    if (filename.endsWith('.js')) {
        addLib(filename);
        createDeclarations(libAlias).catch(logger.error);
    }
})


fs.readdir(userLibsPath, async (_, files) => {
    files.forEach(filename => {
        if (filename.endsWith('.js')) addLib(filename)
    });
    createDeclarations(libAlias).catch();
});



async function createDeclarations(libAliasName: string) {
    if (!isTypesFolderPresent) return;

    // /node_modules/@node-red/editor-client/public/types/other/node-red-contrib-cx-user-lib.d.ts
    let declarations = `declare const ${libAliasName}:{`;
    let combinedDeclarations = '';

    const moduleNames = Object.keys(lib);
    for (const moduleName of moduleNames) {
        const modulePath = userLibsPath + '/' + moduleName + '.d.ts';
        let text = await readFile(modulePath);
        if (!text) continue;

        text = text.replace(/export /g, '');
        text = text.replace('{};', '');
        text = text.replace('nodeRedExport', moduleName);
        text = text.replace(/import.*\n/g, '');

        combinedDeclarations += text;

        // declare const lib:{my_ts_module: typeof my_ts_module,my_module3: typeof my_module3}
        declarations += `${moduleName}: typeof ${moduleName},`;
    }


    declarations += '}\n';
    declarations += combinedDeclarations;
    fs.writeFile(otherTypesPath + '/' + combinedDeclarationFileName, declarations, (err) => {
        if (err) logger.error(err)
    });
}

function addLib(filename: string) {
    const moduleName = filename.slice(0, -3);
    const modulePath = userLibsPath + '/' + moduleName;

    const isModulePresent = !!lib[moduleName];

    const module = require.cache[require.resolve(modulePath)];
    if (module && module.exports && module.exports.destroy) module.exports.destroy();

    delete require.cache[require.resolve(modulePath)];
    delete lib[moduleName];
    try {
        const theExport = require(modulePath).nodeRedExport;
        if (!theExport) {
            return logger.info(`Module ${filename} is not exportable. nodeRedExport is missing in the module.`);
        }
        lib[moduleName] = theExport;
        logger.info(`Module ${filename} was ${isModulePresent ? 'modified' : 'added to the library'}.`);
    } catch (e: any) {
        logger.error('ERROR parsing module: ' + e.message);
    }
}


async function readFile(filePath: string): Promise<string> {
    return new Promise((accept) => {
        fs.readFile(filePath, (err, data) => {
            if (err) return accept('');
            accept(data.toString())
        })
    })
}

export = lib;