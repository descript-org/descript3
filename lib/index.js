const Context = require( './context' );
const { ERROR_ID, create_error, is_error } = require( './error' );

const Cancel = require( './cancel' );
const ArrayBlock = require( './array_block' );
const ObjectBlock = require( './object_block' );
const FunctionBlock = require( './function_block' );
const HttpBlock = require( './http_block' );

const de = {};

de.Context = Context;

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

module.exports = de;

