class DepsDomain {
    constructor( parent ) {
        this.ids = ( parent instanceof DepsDomain ) ? Object.create( parent.ids ) : {};

        this.generate_id = this.generate_id.bind( this );
    }

    generate_id( label ) {
        const id = Symbol( label );
        this.ids[ id ] = true;
        return id;
    }

    is_valid_id( id ) {
        return Boolean( this.ids[ id ] );
    }

}

module.exports = DepsDomain;

