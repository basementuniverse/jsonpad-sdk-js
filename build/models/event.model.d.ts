import { EventStream, IndexEventType, ItemEventType, ListEventType } from '../types';
import { User } from './user.model';
export declare class Event {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    modelId: string;
    stream: EventStream;
    type: ListEventType | ItemEventType | IndexEventType;
    version: string;
    snapshot: any;
    attachments: any;
    constructor(data: Event & {
        createdAt: string;
        updatedAt: string;
        user: User & {
            createdAt: string;
            updatedAt: string;
            lastActiveAt: string | null;
        };
    });
}
