export interface Zone {
    id: number;
    name: string;
    user_id: number;
    disabled: boolean;
    created_at: string | Date;
    is_active: number; // 0 or 1
    zone_package: Array<{
        order_items?: {
            valid_until?: string | Date;
        };
    }>;
}