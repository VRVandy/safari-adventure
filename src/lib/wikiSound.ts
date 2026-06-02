/**
 * Search Wikimedia Commons for a real audio file for an animal.
 * Returns a direct .ogg or .mp3 URL, or null if nothing found.
 */
export async function fetchWikiSound(animalName: string): Promise<string | null> {
  try {
    // Search Commons for sound files matching the animal name
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(animalName + ' sound')}&srnamespace=6&format=json&origin=*&srlimit=5`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const results: { title: string }[] = searchData?.query?.search ?? [];

    for (const result of results) {
      const title = result.title; // e.g. "File:Lion_Roar.ogg"
      const ext = title.split('.').pop()?.toLowerCase();
      if (!ext || !['ogg', 'mp3', 'wav'].includes(ext)) continue;

      // Get the direct file URL
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const infoRes = await fetch(infoUrl);
      const infoData = await infoRes.json();
      const pages = infoData?.query?.pages ?? {};
      const page = Object.values(pages)[0] as any;
      const fileUrl: string | undefined = page?.imageinfo?.[0]?.url;

      if (fileUrl && /\.(ogg|mp3|wav)$/i.test(fileUrl)) {
        return fileUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}
