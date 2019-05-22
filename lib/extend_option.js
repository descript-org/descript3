module.exports = function extend_option( what, by ) {
    if ( what ) {
        if ( by ) {
            return [].concat( what, by );
        }

        return [].concat( what );
    }

    if ( by ) {
        return [].concat( by );
    }

    return null;
};

