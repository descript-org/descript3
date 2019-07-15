const Context = require( './context' );
const { ERROR_ID, create_error, is_error } = require( './error' );

const Cancel = require( './cancel' );
const Logger = require( './logger' );

const request = require( './request' );

const Block = require( './block' );
const ArrayBlock = require( './array_block' );
const ObjectBlock = require( './object_block' );
const FunctionBlock = require( './function_block' );
const HttpBlock = require( './http_block' );

const de = {};

de.Context = Context;
de.Logger = Logger;

de.request = request;

de.ERROR_ID = ERROR_ID;
de.error = create_error;
de.is_error = is_error;

de.Cancel = Cancel;

de.func = function( { block, options } ) {
    return new FunctionBlock( block, options );
};
de.array = function( { block, options } ) {
    return new ArrayBlock( block, options );
};
de.object = function( { block, options } ) {
    return new ObjectBlock( block, options );
};
de.http = function( { block, options } ) {
    return new HttpBlock( block, options );
};

de.is_block = function( block ) {
    return ( block instanceof Block );
};

function generate_id( label ) {
    return Symbol( label );
}

de.run = async function( block, { cancel, params, context } = {} ) {
    if ( !( params && typeof params === 'object' ) ) {
        params = {};
    }
    if ( !cancel ) {
        cancel = new Cancel();
    }
    const run_context = new Context( cancel );

    //  У нас Block тоже является функцией,
    //  так что просто typeof block === 'function' недостаточно проверить.
    //
    if ( !( block instanceof Block ) && ( typeof block === 'function' ) ) {
        block = await block( { params, context, cancel, generate_id } );
    }
    if ( !( block instanceof Block ) ) {
        return block;
    }

    //  На тот случай, когда у нас запускается один блок и у него сразу есть зависимости.
    run_context.queue_deps_check();

    //  FIXME: Тут надо передавать deps_domain.
    //
    return block._run( run_context, cancel, params, context );
};

module.exports = de;

