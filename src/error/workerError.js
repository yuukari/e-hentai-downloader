import CommonError from './commonError.js';

function WorkerError(message, workerId) {
    this.name = 'WorkerError';
    this.message = message;
    this.workerId = workerId;
}
WorkerError.prototype = CommonError.prototype;

export default WorkerError;