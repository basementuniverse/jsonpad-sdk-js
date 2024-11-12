import { User } from './user.model';
export declare class List {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    name: string;
    description: string;
    pathName: string;
    schema: any;
    pinned: boolean;
    readonly: boolean;
    realtime: boolean;
    protected: boolean;
    indexable: boolean;
    activated: boolean;
    itemCount: number;
    constructor(data: List & {
        createdAt: string;
        updatedAt: string;
        user: User & {
            createdAt: string;
            updatedAt: string;
            lastActiveAt: string | null;
        };
    });
}
