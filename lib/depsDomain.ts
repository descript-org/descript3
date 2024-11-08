//TODO как это типизировать any этот?
export type DescriptBlockDeps = Record<DescriptBlockId, any>;
export type DescriptBlockId = symbol;
export type GenerateId = (label?: string) => DescriptBlockId;

class DepsDomain {
    ids: Record<DescriptBlockId, boolean>;
    constructor(parent: any) {
        this.ids = (parent instanceof DepsDomain) ? Object.create(parent.ids) : {};

    }

    generateId: GenerateId = (label?: string): DescriptBlockId => {
        const id = Symbol(label);
        this.ids[ id ] = true;
        return id;
    };

    isValidId(id: DescriptBlockId) {
        return Boolean(this.ids[ id ]);
    }

}

export default DepsDomain;
