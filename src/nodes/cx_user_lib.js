"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_service_1 = __importDefault(require("../services/logger.service"));
module.exports = function (RED) {
    function UserLibStatus(config) {
        const node = this;
        RED.nodes.createNode(node, config);
        const unregister = logger_service_1.default.registerLogCallback((message, isError) => {
            node.send({
                topic: isError ? "ERROR" : "STATUS",
                payload: message
            });
        });
        node.on('close', unregister);
    }
    RED.nodes.registerType("cx-user-lib-status", UserLibStatus);
};
//# sourceMappingURL=cx_user_lib.js.map