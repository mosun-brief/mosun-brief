-- =============================================================================
-- Mosunbrief 보안: 익명(anon) 쓰기 차단 + RLS 정리
-- 적용: Supabase Dashboard → SQL Editor 에 붙여넣고 Run.
-- 안전하게 여러 번 실행해도 됩니다(idempotent).
--
-- 배경: public anon 키는 브라우저에 노출됩니다. 점검 결과 이 키로 subscribers
-- 테이블에 INSERT가 가능(HTTP 201)했습니다. 앱의 서버 라우트는 service_role 키로
-- 동작하므로 anon 에게는 어떤 쓰기 권한도 필요 없습니다. 아래는 anon/authenticated
-- 의 테이블 권한을 회수하고 RLS를 켭니다. service_role 은 bypassrls 라 앱은 그대로
-- 동작합니다.
-- =============================================================================

-- 1) PII/운영 데이터 테이블: RLS 켜고 anon/authenticated 의 모든 권한 회수
--    (읽기·쓰기 모두 service_role 서버 라우트로만 이뤄집니다.)
do $$
declare
  t text;
  pii_tables text[] := array[
    'subscribers',
    'subscriber_category_answers',
    'feedbacks',
    'newsletter_items',
    'newsletter_item_category_targets',
    'newsletter_delivery_logs',
    'newsletter_daily_send_locks'
  ];
begin
  foreach t in array pii_tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon', t);
      execute format('revoke all on public.%I from authenticated', t);
    end if;
  end loop;
end $$;

-- 2) 공개 설정 테이블: 가입 화면이 anon 으로 SELECT 해야 하므로 읽기만 허용합니다.
--    RLS 켜고 → 모든 권한 회수 → SELECT 만 재부여 → is_active 행만 보이는 정책 생성.
do $$
declare
  t text;
  config_tables text[] := array[
    'subscriber_category_groups',
    'subscriber_category_options'
  ];
begin
  foreach t in array config_tables loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon', t);
      execute format('revoke all on public.%I from authenticated', t);
      execute format('grant select on public.%I to anon, authenticated', t);
      execute format('drop policy if exists "public read active rows" on public.%I', t);
      execute format(
        'create policy "public read active rows" on public.%I for select to anon, authenticated using (is_active = true)',
        t
      );
    end if;
  end loop;
end $$;

-- 3) (선택) 다른 PII 테이블이 있다면 위 1)번 배열에 테이블명을 추가해 같은 방식으로
--    잠그세요. 예: build_requests, build_consultations 등.

-- =============================================================================
-- 검증: 아래 쿼리로 anon 이 쓰기 권한을 갖고 있지 않은지 확인합니다(빈 결과여야 정상).
-- =============================================================================
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee = 'anon'
--   and table_name in (
--     'subscribers','feedbacks','newsletter_delivery_logs',
--     'subscriber_category_answers','newsletter_items',
--     'newsletter_item_category_targets','newsletter_daily_send_locks'
--   );
