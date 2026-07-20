import { NextResponse } from 'next/server';
import { requireAdminGuard } from '@/lib/auth';
import { parseJsonBody } from '@/lib/utils/misc';
import { revalidateShopPaths } from '@/lib/api-helpers';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/constants';
import { categoryHierarchySchema } from '@/lib/validations';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: categories, error } = await supabase
      .from(TABLES.categories)
      .select('name, parent_category')
      .order('name');

    if (error) {
      return NextResponse.json({ error: 'Failed to load categories.' }, { status: 500 });
    }

    const mainCategories = categories.filter((c) => !c.parent_category);
    const hierarchy = mainCategories.map((main) => ({
      name: main.name,
      icon: 'category',
      subcategories: categories
        .filter((c) => c.parent_category === main.name)
        .map((c) => c.name),
    }));

    return NextResponse.json(hierarchy, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load categories.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;

  const body = await parseJsonBody<unknown>(request);
  if (body instanceof NextResponse) return body;

  const validation = categoryHierarchySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid category data', details: validation.error.flatten() }, { status: 400 });
  }

  const validatedBody = validation.data;

  try {
    const supabase = createSupabaseAdminClient();
    const mainCatNames = validatedBody.map((m) => m.name.trim());
    const allSubCats = validatedBody.flatMap((m) => m.subcategories.map((s: string) => s.trim()));
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

    const updatePromises = validatedBody
      .filter((group) => group.subcategories.length > 0)
      .map((group) =>
        supabase
          .from(TABLES.categories)
          .update({ parent_category: group.name.trim() })
          .in('name', group.subcategories.map((s: string) => s.trim()))
      );

    const updateResults = await Promise.all(updatePromises);
    const firstErr = updateResults.find((res) => res.error)?.error;
    if (firstErr) throw firstErr;

    revalidateShopPaths();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save category hierarchy.' }, { status: 500 });
  }
}
