let fileOperationQueue = Promise.resolve();

function withFileLock(label, operation) {
    const guardedOperation = async () => {
        try {
            return await operation();
        } catch (error) {
            console.error(`[LOCK:${label}] Erro durante operacao de arquivo:`, error);
            throw error;
        }
    };

    const execution = fileOperationQueue.then(guardedOperation);
    fileOperationQueue = execution.catch(() => { });
    return execution;
}

function waitForFileQueue() {
    return fileOperationQueue.catch(() => { });
}

module.exports = {
    withFileLock,
    waitForFileQueue
};
