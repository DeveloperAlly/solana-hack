-- The signed registration's last valid block height: a send whose outcome is unknown is only reopened once the
-- chain is past this height (the transaction can no longer land), not after a wall-clock wait.
alter table public.posts add column if not exists last_valid_block_height bigint;
