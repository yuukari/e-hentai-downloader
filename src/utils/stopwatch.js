const stopwatch = () => {
    let _startAt = null;
    let _result = null;

    const start = () => {
        _result = null;
        _startAt = Date.now();
    }

    const stop = () => {
        _result = Date.now() - _startAt;
        _startAt = null;
    }

    const getResult = () => _result;

    const getFormattedResult = () => _result !== null ?
        `${(_result / 1000).toFixed(2)} sec` :
        `? sec`;

    return {
        start,
        stop,

        getResult,
        getFormattedResult
    }
}

export default stopwatch();