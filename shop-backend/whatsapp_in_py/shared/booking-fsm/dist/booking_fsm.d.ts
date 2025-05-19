export type AccountType = 'individual' | 'enterprise';
export interface Worker {
    worker_id: string | number;
    name: string;
    specialties?: string[];
}
export interface BookingContext {
    shop_id: string;
    accountType: AccountType;
    workers: Worker[];
    config: any;
    step: number;
    clientName?: string;
    selectedService?: string;
    selectedWorker?: Worker;
    selectedDate?: string;
    selectedTime?: string;
}
export interface FSMResult {
    reply: string;
    context: BookingContext;
    appointment?: {
        worker_id: string | number;
        date: string;
        start_time: string;
        client_name: string;
    };
}
export declare function handleMessage(inpTextRaw: string, ctx: BookingContext): FSMResult;
export declare function getSuggestedOptions(ctx: BookingContext): string[];
