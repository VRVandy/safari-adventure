async function pageImage(title: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.query?.pages) return null;
    const page = Object.values(data.query.pages)[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

async function searchImage(query: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3&srnamespace=0`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.query?.search) return null;
    for (const result of data.query.search as any[]) {
      const img = await pageImage(result.title);
      if (img) return img;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchWikiImage(
  name: string,
  scientificName?: string
): Promise<string | null> {
  return (
    (await pageImage(name)) ??
    (scientificName ? await pageImage(scientificName) : null) ??
    (await searchImage(name))
  );
}
