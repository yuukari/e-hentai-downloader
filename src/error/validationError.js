import CommonError from './commonError.js';

function ValidationError (message) {
    this.name = 'ValidationError';
    this.message = message;
}
ValidationError.prototype = CommonError.prototype;

export default ValidationError;