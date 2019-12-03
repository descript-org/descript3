const Context = require( './context' );
const { ERROR_ID, create_error, is_error } = require( './error' );

const Cancel = require( './cancel' );
const Logger = require( './logger' );
const Cache = require( './cache' );

const request = require( './request' );

const Block = require( './block' );
const ArrayBlock = require( './array_block' );
const ObjectBlock = require( './object_block' );
const FunctionBlock = require( './function_block' );
const HttpBlock = require( './http_block' );
const PipeBlock = require( './pipe_block' );
const FirstBlock = require( './first_block' );

const de = {};

de.Logger = Logger;
de.Cache = Cache;

de.request = request;

de.ERROR_ID = ERROR_ID;
de.error = create_error;
de.is_error = is_error;

de.Cancel = Cancel;

de.func = function( { block, options } = {} ) {
    return new FunctionBlock( block, options );
};
de.array = function( { block, options } = {} ) {
    return new ArrayBlock( block, options );
};
de.object = function( { block, options } = {} ) {
    return new ObjectBlock( block, options );
};
de.http = function( { block, options } = {} ) {
    return new HttpBlock( block, options );
};
de.pipe = function( { block, options } = {} ) {
    return new PipeBlock( block, options );
};
de.first = function( { block, options } = {} ) {
    return new FirstBlock( block, options );
};

de.is_block = function( block ) {
    return ( block instanceof Block );
};

de.run = function( block, { params, context, cancel } = {} ) {
    const run_context = new Context();

    if ( !( params && typeof params === 'object' ) ) {
        params = {};
    }
    if ( !cancel ) {
        cancel = new Cancel();
    }

    const block_cancel = cancel.create();

    return run_context.run( { block, block_cancel, params, cancel, context } );
};

module.exports = de;

