import {NodeAPI, NodeDef} from "node-red";
import Logger from "../services/logger.service";

interface IConfig extends NodeDef {
    name: string
}


module.exports = function(RED: NodeAPI) {

    function UserLibStatus(config: IConfig) {
        // @ts-ignore
        const node = this;
        RED.nodes.createNode(node, config);


        const unregister = Logger.registerLogCallback((message, isError) => {
            node.send({
                topic: isError ? "ERROR" : "STATUS",
                payload: message
            })
        })

        node.on('close', unregister);
    }

    RED.nodes.registerType("cx-user-lib-status", UserLibStatus);
}
