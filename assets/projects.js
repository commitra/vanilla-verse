export async function loadProjects() {
    const res = await fetch('data/projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch projects.json');
    /** @type {Array<{title:string,slug:string,description:string,category:string,categoryKey:string,difficulty?:string}>} */
    const list = await res.json();
    return list.map(p => ({
        ...p,
        href: `projects/${p.slug}/index.html`
    }));
}
