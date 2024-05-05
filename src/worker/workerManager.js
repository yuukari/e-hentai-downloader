import * as io from './../io.js';
import downloadWorker from './downloadWorker.js';

const workerManager = () => {
    let _workers;
    let _poolSize;

    let _onWorkerDone;
    let _onWorkerFailed;

    const init = ({
        pagesData,
        poolSize,
        retriesCount,

        outputDirectory,
        filenameTemplate,
        initialCounter,

        onWorkerDone,
        onWorkerFailed
    }) => {
        let counter = initialCounter;

        _workers = pagesData.map((pageData, i) => {
            const dw = downloadWorker({
                id: i,
                retriesCount,

                pageLink: pageData.pageLink,
                outputDirectory: outputDirectory,

                filenameTemplate,
                counter
            });

            counter++;

            return {
                id: i,
                ...pageData,
                status: 'ready',
                promise: dw.run
            };
        });
        _poolSize = poolSize;

        _onWorkerDone = onWorkerDone;
        _onWorkerFailed = onWorkerFailed;
    };

    const run = () => new Promise((resolve) => {
        const poolLoop = setInterval(() => {
            const _unhandledWorkers = _workers.filter(w => ['ready', 'active'].includes(w.status)).length;
            if (_unhandledWorkers === 0) {
                resolve();
                clearInterval(poolLoop);
            }

            while (_getActiveWorkersCount() < _poolSize) {
                const worker = _workers.find(w => w.status === 'ready');
                if (worker === undefined) {
                    break;
                }

                // io.info(`Running worker #${worker.id}, page ${worker.pageLink}`);
                _runWorker(worker);
            }
        }, 100);
    });

    const _runWorker = (worker) => {
        _workers[worker.id].status = 'active';

        worker.promise()
            .then((id) => {
                // io.info(`Worker #${id} done his work successfully`);
                _workers[worker.id].status = 'done';

                if (_onWorkerDone !== undefined) {
                    _onWorkerDone(worker.id);
                }
            })
            .catch((e) => {
                if (_onWorkerFailed !== undefined) {
                    _onWorkerFailed(e.name === 'WorkerError' ? e.workerId : undefined);
                }

                if (e.name === 'WorkerError') {
                    // io.warning(`Worker #${e.workerId} failed to done his work (><)`);
                    _workers[e.workerId].status = 'failed';
                    return;
                }

                // io.error('Fatal error occurred in worker (><)', e);
                throw new Error(`Fatal error occurred in worker (><): ${e.message}`);
            });
    };

    const getTotalWorkersCount = () => _workers.length;
    const getProcessedWorkersCount = () =>  _workers.filter(w => ['done', 'failed'].includes(w.status)).length;
    const getFailedWorkersCount = () => _workers.filter(w => w.status === 'failed').length;

    const _getActiveWorkersCount = () => _workers.filter(w => w.status === 'active').length;

    return {
        init,
        run,

        getTotalWorkersCount,
        getProcessedWorkersCount,
        getFailedWorkersCount
    };
};

export default workerManager();