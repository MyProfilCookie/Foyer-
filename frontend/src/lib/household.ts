import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canAccessSection, type Section } from '@/app/_shared/theme';

export type { Section };
export { canAccessSection };

export type Parent = {
  id: string;
  household_id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  relationship: string;
  permissions: string[];
  avatar_path: string | null;
  created_at: string;
};

export type Child = {
  id: string;
  household_id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
};

export type Household = {
  id: string;
  name: string;
  owner_id: string | null;
};

export async function requireHousehold(section?: Section) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: ownParent } = await supabase
    .from('parents')
    .select('*')
    .eq('email', user.email)
    .maybeSingle();

  if (!ownParent) {
    return {
      supabase,
      user,
      household: null as Household | null,
      householdId: null as string | null,
      ownParent: null as Parent | null,
      isOwner: false,
      isAdmin: false,
      parents: [] as Parent[],
      children: [] as Child[],
    };
  }

  const typedOwnParent = ownParent as Parent;

  if (section && !canAccessSection(typedOwnParent, section)) {
    redirect('/dashboard');
  }

  const [{ data: household }, { data: parents }, { data: children }] = await Promise.all([
    supabase.from('households').select('id, name, owner_id').eq('id', typedOwnParent.household_id).maybeSingle(),
    supabase.from('parents').select('*').eq('household_id', typedOwnParent.household_id).order('created_at'),
    supabase.from('children').select('*').eq('household_id', typedOwnParent.household_id).order('created_at'),
  ]);

  return {
    supabase,
    user,
    household: (household ?? null) as Household | null,
    householdId: typedOwnParent.household_id as string,
    ownParent: typedOwnParent,
    isOwner: household?.owner_id === typedOwnParent.id,
    isAdmin: typedOwnParent.role === 'owner' || typedOwnParent.role === 'admin',
    parents: (parents ?? []) as Parent[],
    children: (children ?? []) as Child[],
  };
}
