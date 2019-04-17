module.exports = function get_deferred() {
    let resolve;
    let reject;
    const promise = new Promise( function( _resolve, _reject ) {
        resolve = _resolve;
        reject = _reject;
    } );

    return {
        promise: promise,
        resolve: resolve,
        reject: reject,
    };
};

