import { IndexValueType, OrderDirection } from '../types';
export declare class Index {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string;
    pathName: string;
    pointer: string;
    valueType: IndexValueType;
    alias: boolean;
    sorting: boolean;
    filtering: boolean;
    searching: boolean;
    defaultOrderDirection: OrderDirection;
    activated: boolean;
    constructor(data: Index & {
        createdAt: string;
        updatedAt: string;
    });
}
