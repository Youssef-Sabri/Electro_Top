import { NextResponse } from 'next/server';
import { requireAdminGuard } from '@/lib/auth';
import { parseJsonBody } from '@/lib/utils/misc';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: categories, error } = await supabase
      .from(TABLES.categories)
      .select('name, parent_category')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mainCategories = categories.filter((c) => !c.parent_category);
    const hierarchy = mainCategories.map((main) => ({
      name: main.name,
      icon: 'category',
      subcategories: categories
        .filter((c) => c.parent_category === main.name)
        .map((c) => c.name),
    }));

    return NextResponse.json(hierarchy);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to read category hierarchy';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;

  interface CategoryGroup {
    name: string;
    subcategories: string[];
  }

  const body = await parseJsonBody<CategoryGroup[]>(request);
  if (body instanceof NextResponse) return body;

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid data format. Expected an array.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const mainCatNames = body.map((m) => m.name.trim());
    const allSubCats = body.flatMap((m) => m.subcategories.map((s: string) => s.trim()));
    const allActiveNames = [...new Set([...mainCatNames, ...allSubCats])];

    if (allActiveNames.length > 0) {
      const { error: mainErr } = await supabase
        .from(TABLES.categories)
        .upsert(mainCatNames.map((name) => ({ name })), { onConflict: 'name' });
      if (mainErr) throw mainErr;

      if (allSubCats.length > 0) {
        const { error: subErr } = await supabase
          .from(TABLES.categories)
          .upsert(allSubCats.map((name) => ({ name })), { onConflict: 'name' });
        if (subErr) throw subErr;
      }
    }

    const { data: dbCats, error: fetchErr } = await supabase
      .from(TABLES.categories)
      .select('name');
    if (fetchErr) throw fetchErr;

    const toDelete = dbCats.map((c) => c.name).filter((name) => !allActiveNames.includes(name));
    if (toDelete.length > 0) {
      const { error: deleteErr } = await supabase
        .from(TABLES.categories)
        .delete()
        .in('name', toDelete);
      if (deleteErr) throw deleteErr;
    }

    const { error: resetErr } = await supabase
      .from(TABLES.categories)
      .update({ parent_category: null })
      .neq('name', '');
    if (resetErr) throw resetErr;

    for (const group of body) {
      if (group.subcategories.length > 0) {
        const { error: updateErr } = await supabase
          .from(TABLES.categories)
          .update({ parent_category: group.name.trim() })
          .in('name', group.subcategories.map((s: string) => s.trim()));
        if (updateErr) throw updateErr;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save category hierarchy';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
