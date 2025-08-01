export interface DNSRecord {
    id: number;
    name: string;
    type: number; // smallint u MySQL je broj
    ttl: number;
    data: string;
    zone_id: number;
    user_id: number;
    auth_key: string;
    created_at: string; // ili Date ako ih odmah pretvaraš
    updated_at: string;
    soft_deleted_at: string | null;
    disabled: boolean; // tinyint => boolean
}
