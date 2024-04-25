// plugins/seo.js

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('page:finish', async () => {
        const route = useRoute();
        const fullUrl = `http://admin.wikinutritionals.com${route.fullPath}`;
        const apiUrl = `http://admin.wikinutritionals.com/wp-json/yoast/v1/get_head?url=${encodeURIComponent(fullUrl)}`;
        
        try {
            const data = await $fetch(apiUrl);
            useHead({
                title: data.yoast_head.title,
                meta: [
                    { hid: 'description', name: 'description', content: data.yoast_head.meta_description },
                    { hid: 'og:title', property: 'og:title', content: data.yoast_head.og_title },
                    { hid: 'og:description', property: 'og:description', content: data.yoast_head.og_description },
                    { hid: 'og:image', property: 'og:image', content: data.yoast_head.og_image }
                ]
            });
        } catch (error) {
            console.error('Failed to fetch SEO data:', error);
        }
    });
});
