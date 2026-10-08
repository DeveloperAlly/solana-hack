-- When a kit's Solana registration completed (created_at is when the attempt began), for ledger order.
alter table public.kits add column if not exists registered_at timestamptz;
update public.kits set registered_at = created_at where status = 'registered' and registered_at is null;
