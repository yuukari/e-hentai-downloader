function CommonError(message) {
    this.name = 'CommonError';
    this.message = message;
}
CommonError.prototype = Error.prototype;

export default CommonError;